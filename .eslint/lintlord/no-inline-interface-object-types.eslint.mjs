/**
 * @fileoverview Lintlord ESLint plugin/config: disallow inline object type literals in interface property types.
 *
 * Why:
 * Inline object type literals inside interfaces make types harder to reuse, document, and test.
 * Prefer extracting the object type into a named `type`/`interface` and reference it.
 *
 * What it catches (examples):
 * - interface X { events: { a: string }[] }           ❌
 * - interface X { events: Array<{ a: string }> }      ❌
 * - interface X { events: Readonly<{ a: string }> }   ❌
 * - interface X { events: ({ a: string } | null)[] }  ❌
 *
 * What it allows (examples):
 * - interface Event { a: string }
 *   interface X { events: Event[] }                   ✅
 *
 * Options:
 * - allowTypeAliases: boolean (default: true)
 *   If false, also flags: `type X = { a: string }`
 *
 * Usage (flat config):
 *   import lintlordEslint from './eslint/lintlord/lintlord.eslint.mjs';
 *   export default [
 *     ...lintlordEslint,
 *   ];
 *
 * @author Dmytro Vakulenko
 * @version 1.0.0
 */

const RULE_NAME = 'no-inline-interface-object-types';

/**
 * Recursively checks if a TS type node contains a TSTypeLiteral (inline `{ ... }` type).
 * Works across arrays, unions, intersections, generics, parenthesized types, etc.
 *
 * @param {any} node ESTree/TypeScript-ESTree node
 * @returns {boolean}
 */
function containsTypeLiteral(node) {
  if (!node) {
    return false;
  }

  if (node.type === 'TSTypeLiteral') {
    return true;
  }

  // Common wrappers / structures
  switch (node.type) {
    case 'TSTypeAnnotation': {
      return containsTypeLiteral(node.typeAnnotation);
    }

    case 'TSArrayType': {
      return containsTypeLiteral(node.elementType);
    }

    case 'TSParenthesizedType': {
      return containsTypeLiteral(node.typeAnnotation);
    }

    case 'TSUnionType':
    case 'TSIntersectionType': {
      return Array.isArray(node.types) && node.types.some(containsTypeLiteral);
    }

    case 'TSTypeOperator': {
      return containsTypeLiteral(node.typeAnnotation);
    }

    case 'TSIndexedAccessType': {
      return containsTypeLiteral(node.objectType) || containsTypeLiteral(node.indexType);
    }

    case 'TSConditionalType': {
      return (
        containsTypeLiteral(node.checkType) ||
        containsTypeLiteral(node.extendsType) ||
        containsTypeLiteral(node.trueType) ||
        containsTypeLiteral(node.falseType)
      );
    }

    case 'TSInferType': {
      return containsTypeLiteral(node.typeParameter);
    }

    case 'TSMappedType': {
      // Mapped types can contain type annotations + type parameters
      return containsTypeLiteral(node.typeAnnotation) || containsTypeLiteral(node.typeParameter) || containsTypeLiteral(node.nameType);
    }

    case 'TSTypeReference': {
      // e.g. Array<{...}>, Readonly<{...}>
      return (
        node.typeArguments &&
        node.typeArguments.type === 'TSTypeParameterInstantiation' &&
        Array.isArray(node.typeArguments.params) &&
        node.typeArguments.params.some(containsTypeLiteral)
      );
    }

    case 'TSFunctionType':
    case 'TSConstructorType': {
      return (Array.isArray(node.params) && node.params.some(containsTypeLiteral)) || containsTypeLiteral(node.returnType);
    }

    default: {
      // Generic fallback: walk all child nodes
      for (const value of Object.values(node)) {
        if (!value) {
          continue;
        }

        if (Array.isArray(value)) {
          if (value.some((v) => v && typeof v === 'object' && containsTypeLiteral(v))) {
            return true;
          }
        } else if (typeof value === 'object' && containsTypeLiteral(value)) {
          return true;
        }
      }

      return false;
    }
  }
}

/**
 * @type {import('eslint').Rule.RuleModule}
 */
const noInlineInterfaceObjectTypesRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow inline object type literals inside interface property types; require extracting to a named type/interface.',
      recommended: false,
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allowTypeAliases: { type: 'boolean' },
        },
      },
    ],
    messages: {
      inlineObjectType:
        'Inline object type literal is not allowed in interface properties. Extract it to a named type/interface and reference it.',
      inlineObjectTypeAlias:
        'Inline object type literal is not allowed in type aliases. Extract it to a named type/interface and reference it.',
    },
  },

  create(context) {
    const [{ allowTypeAliases = true } = {}] = context.options;

    function reportTypeLiteral(nodeToReport) {
      context.report({
        node: nodeToReport,
        messageId: 'inlineObjectType',
      });
    }

    return {
      /**
       * Flags: interface X { prop: { ... } }
       * Specifically: TSPropertySignature nodes whose type annotation contains TSTypeLiteral anywhere.
       */
      TSInterfaceDeclaration(node) {
        const { body } = node;

        if (!body || !Array.isArray(body.body)) {
          return;
        }

        for (const member of body.body) {
          if (member?.type !== 'TSPropertySignature') {
            continue;
          }

          // Must have a type annotation to check
          const typeAnn = member.typeAnnotation;

          if (!typeAnn) {
            continue;
          }

          if (containsTypeLiteral(typeAnn)) {
            // Report the type annotation region to highlight the offending area
            reportTypeLiteral(typeAnn);
          }
        }
      },

      /**
       * Optional: flag `type X = { ... }` if allowTypeAliases === false
       */
      TSTypeAliasDeclaration(node) {
        if (allowTypeAliases) {
          return;
        }

        if (containsTypeLiteral(node.typeAnnotation)) {
          context.report({
            node: node.typeAnnotation,
            messageId: 'inlineObjectTypeAlias',
          });
        }
      },
    };
  },
};

/**
 * Inline “local plugin” for flat config.
 * You can rename the plugin key (e.g. 'dv') to whatever namespace you want.
 */
export const plugin = {
  rules: {
    [RULE_NAME]: noInlineInterfaceObjectTypesRule,
  },
};
