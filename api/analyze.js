
const ALLOWED_ORIGIN = "https://kyloo731231.github.io";

module.exports = async function handler(req, res) {
    // Разрешаем запросы с твоего сайта GitHub Pages
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Разрешён только POST-запрос."
        });
    }

    if (req.headers.origin !== ALLOWED_ORIGIN) {
        return res.status(403).json({
            error: "Источник запроса не разрешён."
        });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) {
        return res.status(500).json({
            error: "На Vercel не настроен GEMINI_API_KEY."
        });
    }

    try {
        const body = req.body || {};
        const product = body.product;

        if (
            typeof product !== "string" ||
            !product.trim() ||
            product.length > 200
        ) {
            return res.status(400).json({
                error: "Укажи название продукта до 200 символов."
            });
        }

        const prompt = `
Ты помощник по оценке пищевой ценности продуктов.

Определи калории, белки, жиры и углеводы на 100 г продукта.
Для напитков используй значения на 100 мл.
Учитывай способ приготовления, если он указан.

Если запрос не относится к еде или напиткам, верни:
{"error":"NOT_FOOD"}

Для еды верни только JSON:
{"kcal":число,"proteins":число,"fats":число,"carbs":число}

Все значения должны быть конечными неотрицательными числами.
Не добавляй Markdown, пояснения или другие поля.

Название продукта: ${product.trim()}
        `.trim();

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        let response;

        try {
            response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
                {
                    method: "POST",
                    signal: controller.signal,
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": apiKey
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            responseMimeType: "application/json"
                        }
                    })
                }
            );
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            const details = await response.text();

            // Подробности остаются в серверных логах, не в браузере.
            console.error(
                "Gemini API error:",
                response.status,
                details
            );

            if (response.status === 429) {
                return res.status(503).json({
                    error: "Лимит запросов Gemini исчерпан. Попробуй позже."
                });
            }

            if (response.status === 401 || response.status === 403) {
                return res.status(502).json({
                    error: "Gemini отклонил доступ. Проверь API-ключ и его права."
                });
            }

            if (response.status === 404) {
                return res.status(502).json({
                    error: "Модель Gemini не найдена. Проверь GEMINI_MODEL в Vercel."
                });
            }

            return res.status(502).json({
                error: `Ошибка Gemini API: HTTP ${response.status}.`
            });
        }

        const data = await response.json();

        const answer = data.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

        if (!answer) {
            console.error("Gemini returned no text:", data);

            return res.status(502).json({
                error: "Gemini не вернул результат."
            });
        }

        let result;

        try {
            result = JSON.parse(answer);
        } catch {
            return res.status(502).json({
                error: "Gemini вернул некорректный JSON."
            });
        }

        if (result.error === "NOT_FOOD") {
            return res.status(422).json({
                error: "Укажи конкретный продукт или напиток."
            });
        }

        const fields = ["kcal", "proteins", "fats", "carbs"];

        for (const field of fields) {
            if (
                typeof result[field] !== "number" ||
                !Number.isFinite(result[field]) ||
                result[field] < 0
            ) {
                return res.status(502).json({
                    error: "Gemini вернул некорректные значения КБЖУ."
                });
            }
        }

        if (
            result.kcal > 1000 ||
            result.proteins > 100 ||
            result.fats > 100 ||
            result.carbs > 100
        ) {
            return res.status(502).json({
                error: "Значения пищевой ценности выглядят недостоверно."
            });
        }

        return res.status(200).json({
            kcal: result.kcal,
            proteins: result.proteins,
            fats: result.fats,
            carbs: result.carbs
        });

    } catch (error) {
        console.error("Server function error:", error);

        return res.status(
            error.name === "AbortError" ? 504 : 500
        ).json({
            error: error.name === "AbortError"
                ? "Gemini не ответил вовремя. Попробуй ещё раз."
                : "Внутренняя ошибка сервера."
        });
    }
};
