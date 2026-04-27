/**
 * Production would use Resend / SES. Demo / $0: log only.
 */
export function sendDigestEmailStub(to: string, subject: string, body: string): void {
  console.info("[travelops:email-stub]", { to, subject, bodyLen: body.length });
}
