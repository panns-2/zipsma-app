
import 'dotenv/config';
import { generateLessonPlan } from '../src/ai/flows/teacher-assistant-flow';

async function test() {
    try {
        console.log("Testing Lesson Plan Generation with env...");
        console.log("API Key Check:", !!process.env.GEMINI_API_KEY);
        const result = await generateLessonPlan({
            subject: "Science",
            classLevel: "Primary 4",
            topic: "Photosynthesis"
        });
        console.log("Success:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error generating lesson plan:", error);
    }
}

test();
