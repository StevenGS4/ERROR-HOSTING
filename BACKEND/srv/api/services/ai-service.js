import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

export async function getAISolution(errorMessage, context = "") {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Modelo correcto, compatible y gratuito
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
    });

    const prompt = `
Eres un experto en depuración de errores de software.
Analiza el siguiente error y genera:
1. Origen probable
2. Causa raíz
3. Solución paso a paso
4. Recomendaciones adicionales

Error:
${errorMessage}

Contexto técnico:
${context}
    `;

    const result = await model.generateContent(prompt);

    return {
      success: true,
      aiResponse: result.response.text(),
    };

  } catch (err) {
    console.error("IA ERROR:", err);
    return {
      success: false,
      aiResponse: "Error en IA: " + err.message,
    };
  }
}
