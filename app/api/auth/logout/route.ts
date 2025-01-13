//import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Remove the token cookie
  cookies().delete('token');

  // Create an HTML response with a script to clear local storage
  const htmlResponse = `
    <html>
      <head>
        <meta http-equiv="Content-Security-Policy" content="script-src 'self'">
      </head>
      <body>
        <script>
          localStorage.removeItem('auth');
          window.location.href = '/';
        </script>
      </body>
    </html>
  `;

  return new Response(htmlResponse, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}