import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function searchCases(query: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Encontre modelos de cases ou gabinetes disponíveis no Brasil (Mercado Livre, Amazon, lojas de eletrônica) que suportem:
    1. Raspberry Pi 4
    2. SSD/HD de 2.5 polegadas
    3. Fonte Colmeia 12V 5A (tipo Intelbras EF 1205+)
    4. Cooler de PC (80mm ou 120mm)
    5. Espaço para Conversor Buck e fiação.
    
    Sugira categorias de produtos como "Caixas para CFTV", "Gabinetes ABS" ou modelos específicos de impressão 3D se forem populares.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return response.text;
}
