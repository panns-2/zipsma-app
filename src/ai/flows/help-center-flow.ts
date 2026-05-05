
'use server';

import { ai, googleAI } from '@/ai/genkit';
import { z } from 'zod';

const HelpCenterInputSchema = z.object({
  question: z.string().describe('The user\'s question or request for help.'),
  userRole: z.enum(['Admin', 'Staff', 'Family', 'Guest']).optional().default('Guest'),
});
export type HelpCenterInput = z.infer<typeof HelpCenterInputSchema>;

const HelpCenterOutputSchema = z.object({
  answer: z.string().describe('A helpful, professional, and accurate answer based on ZipSMA documentation.'),
  suggestedLinks: z.array(z.object({
    title: z.string(),
    url: z.string(),
  })).optional().describe('Relevant links within the app to help the user further.'),
});
export type HelpCenterResponse = z.infer<typeof HelpCenterOutputSchema>;

const helpCenterPrompt = ai.definePrompt({
    name: 'helpCenterPrompt',
    input: { schema: HelpCenterInputSchema },
    output: { schema: HelpCenterOutputSchema },
    model: 'googleai/gemini-2.5-flash',
    prompt: `You are the ZipSMA Support Assistant, a friendly and knowledgeable AI expert on the ZipSMA School Management Application. 
    Your goal is to provide accurate, professional, and helpful support to users (Admins, Staff, and Families) based on the context provided.

    CONTEXT:
    - ZipSMA is a comprehensive School Management Application for West Africa (Ghana focus).
    - Core Features: Student Management, Financial Tracking (Fees, Feeding, Transportation), Attendance & Homework, AI Teacher's Assistant (Teacher's Corner), Parent Communication, Staff/Role Management, and Insightful Dashboards.
    - Billing: Monthly subscription based on the number of active students. 10-day free trial available.
    - Security: Industry-standard measures to protect sensitive student and financial data.
    - Educational Standards: Strictly aligned with GES and NaCCA guidelines (CCP, SBA).
    - Portals: Separate portals for Admins, Staff (Teachers), and Families (Parents).

    USER INFO:
    - User Role: {{userRole}}
    - Question: "{{question}}"

    GUIDELINES:
    1. Be concise but thorough.
    2. Maintain a professional, supportive, and encouraging tone.
    3. If the user asks about a feature, explain how it works and its benefits.
    4. If the user asks about billing or policies, refer to the context provided.
    5. Provide 1-3 suggested internal links if applicable (e.g., "/billing-policy", "/terms-of-service", "/teachers-corner").
    6. If you don't know the answer, politely suggest they contact the school administrator or ZipSMA support directly.`,
});

export const helpCenterFlow = ai.defineFlow(
  {
    name: 'helpCenterFlow',
    inputSchema: HelpCenterInputSchema,
    outputSchema: HelpCenterOutputSchema,
  },
  async (input) => {
    const { output } = await helpCenterPrompt(input);
    return output!;
  }
);

export async function askHelpCenter(input: HelpCenterInput): Promise<HelpCenterResponse> {
  return helpCenterFlow(input);
}
