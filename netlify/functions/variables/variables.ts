import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const myImportantVariable = process.env.MY_IMPORTANT_VARIABLE;

  if (!myImportantVariable) {
    throw 'MY_IMPORTANT_VARIABLE is not missing';
  }

  console.log('Testing logs in Netlify Functions: variables');

  return {
    statusCode: 200,
    body: JSON.stringify({ myImportantVariable }),
    headers: {
      'Content-Type': 'application/json',
    },
  };
};

export { handler };
