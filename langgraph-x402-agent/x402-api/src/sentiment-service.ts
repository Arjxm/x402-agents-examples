/**
 * Sentiment analysis service using OpenAI
 */

interface SentimentResult {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  explanation: string;
}

/**
 * Analyzes the sentiment of text using OpenAI
 *
 * @param text - The text to analyze
 * @param model - OpenAI model to use (default: gpt-3.5-turbo)
 * @param temperature - Temperature for the model (default: 0.3)
 * @returns Sentiment analysis result
 */
export async function analyzeSentiment(
  text: string,
  model: string = 'gpt-3.5-turbo',
  temperature: number = 0.3
): Promise<SentimentResult> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are a sentiment analysis expert. Analyze the sentiment of the given text and respond in JSON format with:
- sentiment: one of "positive", "negative", or "neutral"
- confidence: a number between 0 and 1 indicating confidence
- explanation: a brief explanation of why you chose this sentiment

Example response:
{
  "sentiment": "positive",
  "confidence": 0.95,
  "explanation": "The text expresses strong enthusiasm and satisfaction with the product."
}`
          },
          {
            role: 'user',
            content: `Analyze the sentiment of this text: "${text}"`
          }
        ],
        temperature: temperature,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data: any = await response.json();
    const content = data.choices[0].message.content;

    // Parse the JSON response
    let result: any;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      // If JSON parsing fails, try to extract sentiment from text
      console.warn('Failed to parse JSON response, extracting from text');
      result = {
        sentiment: content.toLowerCase().includes('positive') ? 'positive' :
                  content.toLowerCase().includes('negative') ? 'negative' : 'neutral',
        confidence: 0.5,
        explanation: content
      };
    }

    // Validate sentiment value
    if (!['positive', 'negative', 'neutral'].includes(result.sentiment)) {
      result.sentiment = 'neutral';
    }

    // Ensure confidence is between 0 and 1
    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      result.confidence = 0.5;
    }

    return {
      text: text,
      sentiment: result.sentiment,
      confidence: result.confidence,
      explanation: result.explanation || 'No explanation provided'
    };

  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    throw new Error(`Sentiment analysis failed: ${error.message}`);
  }
}
