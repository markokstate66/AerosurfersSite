const { EmailClient } = require("@azure/communication-email");

module.exports = async function (context, req) {
    const { name, email, company, message } = req.body || {};

    if (!name || !email || !message) {
        context.res = {
            status: 400,
            body: { error: "Name, email, and message are required" }
        };
        return;
    }

    const connectionString = process.env.COMMUNICATION_SERVICES_CONNECTION_STRING;

    if (!connectionString) {
        context.log.error("Missing COMMUNICATION_SERVICES_CONNECTION_STRING");
        context.res = {
            status: 500,
            body: { error: "Server configuration error" }
        };
        return;
    }

    try {
        const emailClient = new EmailClient(connectionString);

        const emailMessage = {
            senderAddress: "DoNotReply@ad42ff73-8a07-4f09-a0e5-75f0a81da5ce.azurecomm.net",
            content: {
                subject: `New Contact Form Submission from ${name}`,
                plainText: `
New contact form submission from The Aerosurfer Group website:

Name: ${name}
Email: ${email}
Company: ${company || "Not provided"}

Message:
${message}
                `.trim(),
                html: `
<h2>New Contact Form Submission</h2>
<p>You have received a new inquiry from The Aerosurfer Group website.</p>
<table style="border-collapse: collapse; margin: 20px 0;">
    <tr>
        <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd;">Name:</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
    </tr>
    <tr>
        <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd;">Email:</td>
        <td style="padding: 8px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td>
    </tr>
    <tr>
        <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd;">Company:</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${company || "Not provided"}</td>
    </tr>
</table>
<h3>Message:</h3>
<p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${message.replace(/\n/g, "<br>")}</p>
                `.trim()
            },
            recipients: {
                to: [{ address: "mark@stgengineer.com", displayName: "Mark" }]
            }
        };

        const poller = await emailClient.beginSend(emailMessage);
        await poller.pollUntilDone();

        context.res = {
            status: 200,
            body: { success: true, message: "Your message has been sent successfully!" }
        };
    } catch (error) {
        context.log.error("Error sending email:", error);
        context.res = {
            status: 500,
            body: { error: "Failed to send message. Please try again later." }
        };
    }
};
