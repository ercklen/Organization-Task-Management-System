import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface StudentRecipient {
  id: string;
  email: string;
  full_name: string;
  preferred_language?: "fr" | "ar" | string | null;
}

interface TaskNotificationData {
  id?: string;
  title: string;
  description?: string | null;
  priority: "low" | "medium" | "high" | "urgent" | string;
  due_date: string;
  creator_name?: string;
}

const priorityColors: Record<string, { bg: string; text: string; labelFr: string; labelAr: string }> = {
  urgent: { bg: "#FEF2F2", text: "#DC2626", labelFr: "Urgente 🚨", labelAr: "عاجلة 🚨" },
  high: { bg: "#FFF1F2", text: "#E11D48", labelFr: "Haute 🔴", labelAr: "عالية 🔴" },
  medium: { bg: "#FEFCE8", text: "#CA8A04", labelFr: "Moyenne 🟡", labelAr: "متوسطة 🟡" },
  low: { bg: "#F0FDF4", text: "#16A34A", labelFr: "Faible 🟢", labelAr: "منخفضة 🟢" },
};

function buildHtmlTemplate({
  student,
  task,
  taskUrl,
}: {
  student: StudentRecipient;
  task: TaskNotificationData;
  taskUrl: string;
}): { subject: string; html: string } {
  const isArabic = student.preferred_language === "ar";
  const priorityInfo = priorityColors[task.priority] || priorityColors.medium;
  const priorityLabel = isArabic ? priorityInfo.labelAr : priorityInfo.labelFr;

  const subject = isArabic
    ? `TaskFlow — مهمة جديدة تم إسنادها إليك: ${task.title}`
    : `TaskFlow — Nouvelle tâche assignée : ${task.title}`;

  if (isArabic) {
    return {
      subject,
      html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #e2e8f0; direction: rtl;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 28px 32px; text-align: right;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">TaskFlow</div>
                    <div style="font-size: 13px; color: #bfdbfe; margin-top: 4px;">منصة إدارة المهام ومتابعة الطلاب</div>
                  </td>
                  <td align="left">
                    <span style="background-color: rgba(255,255,255,0.2); color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px;">مهمة جديدة</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 16px; margin: 0 0 16px; color: #f8fafc; font-weight: 600;">
                مرحباً ${student.full_name || "عزيزي الطالب"}،
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px;">
                قام المسؤول بإسناد مهمة جديدة إليك في النظام. يُرجى الاطلاع على التفاصيل أدناه وإنجازها قبل الموعد النهائي المحدد:
              </p>

              <!-- Task Card -->
              <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h2 style="font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 12px;">
                  ${task.title}
                </h2>

                ${
                  task.description
                    ? `<p style="font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 0 0 16px; white-space: pre-line;">${task.description}</p>`
                    : ""
                }

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #1e293b; padding-top: 12px; margin-top: 12px;">
                  <tr>
                    <td style="font-size: 12px; color: #94a3b8; padding: 4px 0;">الأولوية:</td>
                    <td align="left" style="padding: 4px 0;">
                      <span style="background-color: ${priorityInfo.bg}; color: ${priorityInfo.text}; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 6px; display: inline-block;">
                        ${priorityLabel}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; color: #94a3b8; padding: 4px 0;">الموعد النهائي:</td>
                    <td align="left" style="font-size: 13px; font-weight: 600; color: #f8fafc; padding: 4px 0;">
                      📅 ${task.due_date}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 8px;">
                <tr>
                  <td align="center">
                    <a href="${taskUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
                      عرض المهمة وتأكيد الإنجاز ←
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 32px; border-top: 1px solid #334155; text-align: center;">
              <p style="font-size: 11px; color: #64748b; margin: 0;">
                هذا البريد الإلكتروني أُرسل تلقائياً من نظام TaskFlow. لا تقم بالرد على هذه الرسالة.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    };
  }

  // French template (Default)
  return {
    subject,
    html: `
<!DOCTYPE html>
<html dir="ltr" lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 28px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">TaskFlow</div>
                    <div style="font-size: 13px; color: #bfdbfe; margin-top: 4px;">Système de gestion des tâches & étudiants</div>
                  </td>
                  <td align="right">
                    <span style="background-color: rgba(255,255,255,0.2); color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px;">Nouvelle tâche</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 16px; margin: 0 0 16px; color: #f8fafc; font-weight: 600;">
                Bonjour ${student.full_name || "Étudiant"},
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px;">
                L&apos;administrateur vous a assigné une nouvelle tâche. Veuillez prendre connaissance des détails ci-dessous et la compléter avant la date limite :
              </p>

              <!-- Task Card -->
              <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h2 style="font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 12px;">
                  ${task.title}
                </h2>

                ${
                  task.description
                    ? `<p style="font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 0 0 16px; white-space: pre-line;">${task.description}</p>`
                    : ""
                }

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #1e293b; padding-top: 12px; margin-top: 12px;">
                  <tr>
                    <td style="font-size: 12px; color: #94a3b8; padding: 4px 0;">Priorité :</td>
                    <td align="right" style="padding: 4px 0;">
                      <span style="background-color: ${priorityInfo.bg}; color: ${priorityInfo.text}; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 6px; display: inline-block;">
                        ${priorityLabel}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; color: #94a3b8; padding: 4px 0;">Date limite :</td>
                    <td align="right" style="font-size: 13px; font-weight: 600; color: #f8fafc; padding: 4px 0;">
                      📅 ${task.due_date}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 8px;">
                <tr>
                  <td align="center">
                    <a href="${taskUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
                      Voir la tâche et marquer comme terminée →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 32px; border-top: 1px solid #334155; text-align: center;">
              <p style="font-size: 11px; color: #64748b; margin: 0;">
                Cet email a été envoyé automatiquement par TaskFlow. Merci de ne pas y répondre directement.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };
}

/**
 * Send email notifications to assigned students via Resend.
 * Non-blocking: catches and logs errors so task creation never fails.
 */
export async function sendTaskAssignmentEmails({
  students,
  task,
}: {
  students: StudentRecipient[];
  task: TaskNotificationData;
}): Promise<{ totalSent: number; errors: string[] }> {
  if (!resend) {
    console.warn("[Resend] Clé RESEND_API_KEY non configurée. Envoi d'email ignoré.");
    return { totalSent: 0, errors: ["RESEND_API_KEY manquante"] };
  }

  if (students.length === 0) {
    return { totalSent: 0, errors: [] };
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const fromAddress = process.env.RESEND_FROM_EMAIL || "TaskFlow <onboarding@resend.dev>";

  let totalSent = 0;
  const errors: string[] = [];

  const promises = students.map(async (student) => {
    if (!student.email) return;

    const locale = student.preferred_language === "ar" ? "ar" : "fr";
    const taskUrl = `${appUrl}/${locale}/tasks`;

    const { subject, html } = buildHtmlTemplate({
      student,
      task,
      taskUrl,
    });

    try {
      const response = await resend!.emails.send({
        from: fromAddress,
        to: [student.email],
        subject,
        html,
      });

      if (response.error) {
        console.error(`[Resend Error] Échec d'envoi à ${student.email}:`, response.error);
        errors.push(`${student.email}: ${response.error.message}`);
      } else {
        totalSent++;
        console.log(`[Resend Success] Email envoyé à ${student.email} (ID: ${response.data?.id})`);
      }
    } catch (err: any) {
      console.error(`[Resend Exception] Exception pour ${student.email}:`, err);
      errors.push(`${student.email}: ${err?.message || "Erreur inconnue"}`);
    }
  });

  await Promise.allSettled(promises);

  return { totalSent, errors };
}
