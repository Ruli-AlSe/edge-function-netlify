import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import * as crypto from 'crypto';

const notify = async (message: string) => {
  const body = {
    content: message,
    embeds: [
      {
        image: {
          url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmgyN25kNmZpZXp2dnQ4ajl1ejkzZXIxNGM3Z3ZzamJ5dHVleWlhMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lqszXeiXOWFqGsGuwP/giphy.gif',
        },
      },
    ],
  };

  const resp = await fetch(process.env.DISCORD_WEBHOOK_URL ?? '', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    console.log(`Failed to send message to Discord: ${resp.statusText}`);
    return false;
  }

  return true;
};

const onStar = (payload: any): string => {
  const { action, sender, repository } = payload;

  return `User ${sender.login} ${action} star on  ${repository.full_name}`;
};

const onIssue = (payload: any): string => {
  const { action, sender, repository } = payload;

  switch (action) {
    case 'opened':
      return `User ${sender.login} opened issue on  ${repository.full_name}`;
    case 'closed':
      return `User ${sender.login} closed issue on  ${repository.full_name}`;
    case 'reopened':
      return `User ${sender.login} reopened issue on  ${repository.full_name}`;
    default:
      return `Unhandled action for the event: ${action}`;
  }
};

const verifySignature = (event: HandlerEvent): boolean => {
  try {
    const signature = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET ?? '')
      .update(event.body ?? '')
      .digest('hex');
    const xHubSignature = event.headers['x-hub-signature-256'] ?? '';

    let trusted = Buffer.from(`sha256=${signature}`, 'ascii');
    let untrusted = Buffer.from(xHubSignature, 'ascii');

    return crypto.timingSafeEqual(trusted, untrusted);
  } catch (error) {
    return false;
  }
};

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const githubEvent = event.headers['x-github-event'] ?? 'unknown';
  if (!verifySignature(event)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized' }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }

  const payload = JSON.parse(event.body ?? '');
  let message: string;

  switch (githubEvent) {
    case 'star':
      message = onStar(payload);
      break;
    case 'issues':
      message = onIssue(payload);
      break;
    default:
      message = `Unknown event: ${githubEvent}`;
  }

  await notify(message);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'done' }),
    headers: {
      'Content-Type': 'application/json',
    },
  };
};

export { handler };
