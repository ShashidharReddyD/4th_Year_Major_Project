import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendReportRequest {
  to: string;
  studentName: string;
  className: string;
  pdfBase64: string;
  customMessage?: string;
  reportData: {
    attendancePercentage: number;
    presentDays: number;
    totalDays: number;
    assignmentsSubmitted: number;
    assignmentsTotal: number;
    chatbotUsage: number;
    weeklyTrend: string;
    focusAreas: string[];
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, studentName, className, pdfBase64, customMessage, reportData }: SendReportRequest = await req.json();

    console.log(`Sending report for ${studentName} to ${to}`);

    // Convert base64 to buffer for attachment
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #fff;
              padding: 30px;
              border: 1px solid #e0e0e0;
              border-top: none;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin: 20px 0;
            }
            .stat-card {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #4285f4;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #4285f4;
              margin-top: 5px;
            }
            .focus-areas {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .focus-areas h3 {
              margin-top: 0;
              color: #856404;
            }
            .focus-areas ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .focus-areas li {
              margin: 5px 0;
              color: #856404;
            }
            .custom-message {
              background: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              font-size: 12px;
              color: #666;
            }
            .button {
              display: inline-block;
              background: #4285f4;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Weekly Progress Report</h1>
            <p style="margin: 0; font-size: 18px;">Presidency School</p>
          </div>
          
          <div class="content">
            <h2>Dear Parent/Guardian,</h2>
            <p>Here is the weekly progress report for <strong>${studentName}</strong> from <strong>Class ${className}</strong>.</p>
            
            ${customMessage ? `
              <div class="custom-message">
                <h3>📝 Message from Teacher</h3>
                <p>${customMessage}</p>
              </div>
            ` : ''}
            
            <h3>📈 Performance Summary</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Attendance Rate</div>
                <div class="stat-value">${reportData.attendancePercentage.toFixed(1)}%</div>
                <small>${reportData.presentDays}/${reportData.totalDays} days present</small>
              </div>
              
              <div class="stat-card">
                <div class="stat-label">Assignments</div>
                <div class="stat-value">${reportData.assignmentsSubmitted}/${reportData.assignmentsTotal}</div>
                <small>${reportData.assignmentsTotal - reportData.assignmentsSubmitted} pending</small>
              </div>
              
              <div class="stat-card">
                <div class="stat-label">Learning Engagement</div>
                <div class="stat-value">${reportData.chatbotUsage}</div>
                <small>AI chatbot interactions</small>
              </div>
              
              <div class="stat-card">
                <div class="stat-label">Weekly Trend</div>
                <div class="stat-value">${reportData.weeklyTrend === 'up' ? '📈' : reportData.weeklyTrend === 'down' ? '📉' : '➡️'}</div>
                <small style="text-transform: capitalize;">${reportData.weeklyTrend}</small>
              </div>
            </div>
            
            ${reportData.focusAreas.length > 0 ? `
              <div class="focus-areas">
                <h3>🎯 Recommended Focus Areas</h3>
                <ul>
                  ${reportData.focusAreas.map(area => `<li>${area}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            <p>A detailed PDF report is attached to this email with charts and comprehensive analysis.</p>
            
            <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
            
            <p><strong>Best regards,</strong><br>
            Presidency School Administration</p>
          </div>
          
          <div class="footer">
            <p>This is an automated report from Presidency School Portal</p>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </body>
      </html>
    `;

    const fileName = `${studentName.replace(/\s+/g, '_')}_Weekly_Report_${new Date().toISOString().split('T')[0]}.pdf`;

    const emailResponse = await resend.emails.send({
      from: "Presidency School <onboarding@resend.dev>",
      to: [to],
      subject: `Weekly Progress Report - ${studentName} (Class ${className})`,
      html: emailHtml,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Report sent successfully",
        emailId: emailResponse.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-parent-report function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to send email"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
