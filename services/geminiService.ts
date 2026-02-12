
import { GoogleGenAI } from "@google/genai";
import { Category } from "../types.ts";

const CATEGORY_INDEX: Category[] = [
  'مبيعات',   // 0
  'مشتريات', // 1
  'رواتب',   // 2
  'إيجار',    // 3
  'خدمات',   // 4
  'تسويق',   // 5
  'صيانة',   // 6
  'أخرى'     // 7
];

/**
 * محرك استدلال محلي متطور (On-Device Inference Simulator)
 */
const predictCategoryLocal = (amount: number, description: string): number => {
  const dayOfMonth = new Date().getDate();
  const lowerDesc = description.toLowerCase();
  let scores = new Array(CATEGORY_INDEX.length).fill(0);

  // قواعد لغوية محاسبية (Arabic Semantic Weights)
  const arabicKeywords: Record<string, number> = {
    'بيع': 0, 'مبيعات': 0, 'فاتورة': 0, 'زبون': 0, 'تحصيل': 0,
    'شراء': 1, 'بضاعة': 1, 'مورد': 1, 'سلعة': 1, 'جرد': 1,
    'راتب': 2, 'معاش': 2, 'موظف': 2, 'عامل': 2, 'سلفة': 2,
    'ايجار': 3, 'إيجار': 3, 'مكتب': 3, 'محل': 3, 'سكن': 3,
    'كهرباء': 4, 'مياه': 4, 'نت': 4, 'اشتراك': 4, 'توصيل': 4,
    'اعلان': 5, 'ممول': 5, 'فيسبوك': 5, 'تسويق': 5, 'دعاية': 5,
    'تصليح': 6, 'صيانة': 6, 'قطع غيار': 6, 'ترميم': 6
  };

  for (const [key, index] of Object.entries(arabicKeywords)) {
    if (lowerDesc.includes(key)) scores[index] += 70;
  }

  // التحليل العددي (Numerical Pattern Matching)
  // الرواتب: مبالغ كبيرة دورية نهاية الشهر
  if (amount >= 2000 && dayOfMonth >= 25) scores[2] += 40;
  
  // الإيجار: مبالغ ثابتة بداية الشهر
  if (amount >= 1000 && dayOfMonth <= 5) scores[3] += 45;

  // المشتريات: مبالغ كبيرة متغيرة
  if (amount >= 500 && scores[1] > 0) scores[1] += 20;

  let maxIndex = 7;
  let maxScore = 10;
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] > maxScore) {
      maxScore = scores[i];
      maxIndex = i;
    }
  }
  return maxIndex;
};

export const suggestCategory = async (
  description: string, 
  amount: number = 0
): Promise<{ category: Category; source: 'local' | 'gemini' }> => {
  const localIndex = predictCategoryLocal(amount, description);
  const localPrediction = CATEGORY_INDEX[localIndex];

  // استخدام Gemini فقط في حالة الغموض التام وتوفر الإنترنت
  if (navigator.onLine && description.length > 8 && localIndex === 7) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `صنف محاسبياً: "${description}" بمبلغ ${amount}. رد بكلمة واحدة من: [${CATEGORY_INDEX.join(', ')}]`,
        config: { temperature: 0.1 },
      });
      const aiText = response.text?.trim() || '';
      const aiCategory = CATEGORY_INDEX.find(c => aiText.includes(c));
      if (aiCategory) return { category: aiCategory, source: 'gemini' };
    } catch (e) { console.warn("Gemini offline fallback active"); }
  }

  return { category: localPrediction, source: 'local' };
};

export const getFinancialAdvice = async (summary: any): Promise<string> => {
  if (!navigator.onLine) return "حافظ على تقليل المصروفات في فترات الركود لزيادة السيولة.";
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `بناءً على دخل ${summary.totalIncome} وصرف ${summary.totalExpense}، أعط نصيحة محاسبية قصيرة جداً لمدير المحل بالعامية المصرية أو العربية الفصحى.`,
    });
    return response.text || "أداؤك المالي مستقر، استمر في المتابعة.";
  } catch (e) { return "راقب تدفقاتك النقدية بدقة."; }
};
