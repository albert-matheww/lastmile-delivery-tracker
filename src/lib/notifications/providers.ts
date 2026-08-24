export type SendResult = { ok: true } | { ok: false; error: string };

export interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<SendResult>;
}

export interface SmsProvider {
  send(to: string, body: string): Promise<SendResult>;
}

/** Default provider when no API key is configured — logs instead of sending. */
class ConsoleEmailProvider implements EmailProvider {
  async send(to: string, subject: string, body: string): Promise<SendResult> {
    console.log(`[email:console] to=${to} subject="${subject}"\n${body}`);
    return { ok: true };
  }
}

class ConsoleSmsProvider implements SmsProvider {
  async send(to: string, body: string): Promise<SendResult> {
    console.log(`[sms:console] to=${to}\n${body}`);
    return { ok: true };
  }
}

class ResendEmailProvider implements EmailProvider {
  constructor(private apiKey: string, private from: string) {}

  async send(to: string, subject: string, body: string): Promise<SendResult> {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(this.apiKey);
      const { error } = await resend.emails.send({
        from: this.from,
        to,
        subject,
        text: body,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Unknown email error" };
    }
  }
}

class TwilioSmsProvider implements SmsProvider {
  constructor(
    private accountSid: string,
    private authToken: string,
    private from: string
  ) {}

  async send(to: string, body: string): Promise<SendResult> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: this.from, Body: body }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `Twilio ${res.status}: ${text}` };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Unknown SMS error" };
    }
  }
}

export function getEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (apiKey && from) return new ResendEmailProvider(apiKey, from);
  return new ConsoleEmailProvider();
}

export function getSmsProvider(): SmsProvider {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (sid && token && from) return new TwilioSmsProvider(sid, token, from);
  return new ConsoleSmsProvider();
}
