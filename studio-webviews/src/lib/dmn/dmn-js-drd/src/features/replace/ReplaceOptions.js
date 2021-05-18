export default {
  DECISION: [
    {
      label: 'Empty',
      actionName: 'replace-with-empty-decision',
      className: 'dmn-icon-clear',
      target: {
        type: 'dmn:Decision',
        table: false,
        expression: false,
        context: false
      }
    },
    {
      label: 'Decision Table',
      actionName: 'replace-with-decision-table',
      className: 'dmn-icon-decision-table',
      target: {
        type: 'dmn:Decision',
        table: true,
        expression: false,
        context: false
      }
    },
    {
      label: 'Literal Expression',
      actionName: 'replace-with-literal-expression',
      className: 'dmn-icon-literal-expression',
      target: {
        type: 'dmn:Decision',
        table: false,
        expression: true,
        context: false
      }
    },
    {
      label: 'Context Expression',
      actionName: 'replace-with-context-expression',
      className: 'dmn-icon-context-expression',
      target: {
        type: 'dmn:Decision',
        table: false,
        expression: false,
        context: true
      }
    }
  ]
};
