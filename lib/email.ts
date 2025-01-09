import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendNotificationEmailProps {
    to: string;
    notification: {
        title: string;
        message: string;
        type: string;
        action_url?: string;
    };
}

export async function sendNotificationEmail(
    { to, notification }: SendNotificationEmailProps,
) {
    try {
        const { data, error } = await resend.emails.send({
            from: "Renewly <notifications@renewly.app>",
            to: [to],
            subject: notification.title,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>${notification.title}</h2>
                    <p>${notification.message}</p>
                    ${
                notification.action_url
                    ? `
                        <p style="margin-top: 20px;">
                            <a href="${process.env.NEXT_PUBLIC_SITE_URL}${notification.action_url}" 
                               style="background-color: #0284c7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                View Details
                            </a>
                        </p>
                    `
                    : ""
            }
                    <p style="margin-top: 20px; font-size: 14px; color: #666;">
                        You're receiving this email because you have notifications enabled for your Renewly account.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("Failed to send notification email:", error);
            return { error };
        }

        return { data };
    } catch (error) {
        console.error("Error sending notification email:", error);
        return { error };
    }
}
