
/*
 * Калькулятор калорий с Google Gemini
 * Функции: анализ еды, подсчёт КБЖУ, дневник, расчёт BMR.
 *
 * ВАЖНО: прямое использование API-ключа в браузере небезопасно.
 * Для публичного сайта используй серверный прокси.
 */

const GEMINI_API_KEY = "AQ.Ab8RN6LnsX9pBftDrnblJAPj6df8OeKhGviflV5xnbo9-lMklg";

const GEMINI_BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta";

let totalKcal = 0;
let totalProteins = 0;
let totalFats = 0;
let totalCarbs = 0;

document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);

    const addBtn = $("add-btn");
    const productInput = $("ai-product-input");
    const weightInput = $("product-weight");
    const diaryList = $("diary-list");

    const kcalSpan = $("total-kcal");
    const proteinsSpan = $("total-proteins");
    const fatsSpan = $("total-fats");
    const carbsSpan = $("total-carbs");

    const calcNormBtn = $("calc-norm-btn");
    const bmrValueSpan = $("bmr-value");

    let selectedModel = null;

    async function getAvailableModel() {
        if (selectedModel) return selectedModel;

        const response = await fetch(
            `${GEMINI_BASE_URL}/models?key=${encodeURIComponent(GEMINI_API_KEY)}`
        );

        if (!response.ok) {
            const details = await response.text();
            console.error("Ошибка списка моделей:", response.status, details);

            throw new Error(
                `Не удалось получить модели Gemini (HTTP ${response.status}). ` +
                "Проверь API-ключ и доступ к Gemini API."
            );
        }

        const data = await response.json();
        const models = data.models || [];

        const preferred = [
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash"
        ];

        for (const name of preferred) {
            const model = models.find(m =>
                m.name?.endsWith(`/models/${name}`) &&
                (m.supportedGenerationMethods || [])
                    .includes("generateContent")
            );

            if (model) {
                selectedModel = model.name;
                console.log("Выбрана модель:", selectedModel);
                return selectedModel;
            }
        }

        const fallback = models.find(m =>
            m.name?.startsWith("models/") &&
            (m.supportedGenerationMethods || [])
                .includes("generateContent") &&
            /flash/i.test(m.name)
        );

        if (!fallback) {
            throw new Error(
                "Не найдена доступная Flash-модель с generateContent. " +
                "Проверь доступные модели в Google AI Studio."
            );
        }

        selectedModel = fallback.name;
        console.log("Выбрана модель:", selectedModel);
        return selectedModel;
    }

    async function askGemini(product) {
        if (
            !GEMINI_API_KEY ||
            GEMINI_API_KEY === "ВСТАВЬ_НОВЫЙ_API_KEY"
        ) {
            throw new Error("Добавь действительный API-ключ Gemini.");
        }

        const model = await getAvailableModel();

        const prompt = `
Ты помощник по подсчёту пищевой ценности.

Определи калорийность, белки, жиры и углеводы продукта
на 100 граммов. Для напитков используй значения на 100 мл.
Учитывай способ приготовления, если он указан.

Если это не еда и не напиток, верни:
{"error":"NOT_FOOD"}

Верни только JSON следующей структуры:
{"kcal":число,"proteins":число,"fats":число,"carbs":число}

Все значения должны быть неотрицательными числами.
Не добавляй пояснения или Markdown.

Продукт: ${product}
        `.trim();

        const response = await fetch(
            `${GEMINI_BASE_URL}/${model}:generateContent?key=` +
            encodeURIComponent(GEMINI_API_KEY),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
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

        if (!response.ok) {
            const details = await response.text();
            console.error(
                "Gemini API:",
                response.status,
                details
            );

            if (response.status === 400) {
                throw new Error(
                    "Gemini отклонил запрос. Проверь параметры API."
                );
            }

            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    "Нет доступа к Gemini. Проверь ключ и разрешения API."
                );
            }

            if (response.status === 404) {
                selectedModel = null;
                throw new Error(
                    "Модель не найдена (404). Обнови список моделей и проверь доступ."
                );
            }

            if (response.status === 429) {
                throw new Error(
                    "Лимит запросов или квота исчерпаны. Попробуй позже."
                );
            }

            throw new Error(`Ошибка Gemini API: HTTP ${response.status}`);
        }

        const data = await response.json();

        const answer = data.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

        if (!answer) {
            console.error("Ответ Gemini:", data);
            throw new Error(
                "Gemini не вернул текст. Запрос мог быть заблокирован."
            );
        }

        let result;

        try {
            result = JSON.parse(
                answer
                    .replace(/^```json\s*/i, "")
                    .replace(/\s*```$/, "")
                    .trim()
            );
        } catch {
            console.error("Некорректный JSON:", answer);
            throw new Error("Gemini вернул некорректный JSON.");
        }

        if (result.error === "NOT_FOOD") return null;

        for (const field of ["kcal", "proteins", "fats", "carbs"]) {
            if (
                typeof result[field] !== "number" ||
                !Number.isFinite(result[field]) ||
                result[field] < 0
            ) {
                throw new Error(
                    "Gemini вернул некорректные значения КБЖУ."
                );
            }
        }

        if (
            result.kcal > 1000 ||
            result.proteins > 100 ||
            result.fats > 100 ||
            result.carbs > 100
        ) {
            throw new Error(
                "Значения на 100 г выглядят недостоверно. Уточни продукт."
            );
        }

        return result;
    }

    addBtn?.addEventListener("click", async () => {
        const product = productInput.value.trim();
        const weight = Number(weightInput.value);

        if (
            !product ||
            !Number.isFinite(weight) ||
            weight <= 0 ||
            weight > 100000
        ) {
            alert("Укажи продукт и корректный вес.");
            return;
        }

        addBtn.disabled = true;
        addBtn.textContent = "Gemini анализирует...";

        try {
            const result = await askGemini(product);

            if (!result) {
                alert("Не удалось распознать еду. Укажи конкретный продукт.");
                return;
            }

            const kcal = Math.round(result.kcal * weight / 100);
            const proteins = result.proteins * weight / 100;
            const fats = result.fats * weight / 100;
            const carbs = result.carbs * weight / 100;

            const item = document.createElement("li");
            item.className = "diary-item";

            const description = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = `${product} — ${weight} г`;

            const details = document.createElement("small");
            details.style.color = "#8d8d99";
            details.textContent =
                `Б: ${proteins.toFixed(1)} г | ` +
                `Ж: ${fats.toFixed(1)} г | ` +
                `У: ${carbs.toFixed(1)} г`;

            const calories = document.createElement("span");
            calories.style.fontWeight = "bold";
            calories.style.color = "#00f5d4";
            calories.textContent = `+${kcal} ккал`;

            description.append(
                title,
                document.createElement("br"),
                details
            );

            item.append(description, calories);
            diaryList.appendChild(item);

            totalKcal += kcal;
            totalProteins += proteins;
            totalFats += fats;
            totalCarbs += carbs;

            kcalSpan.textContent = totalKcal;
            proteinsSpan.textContent = totalProteins.toFixed(1);
            fatsSpan.textContent = totalFats.toFixed(1);
            carbsSpan.textContent = totalCarbs.toFixed(1);

            productInput.value = "";
            weightInput.value = "100";

        } catch (error) {
            console.error(error);
            alert(error.message || "Не удалось обратиться к Gemini.");
        } finally {
            addBtn.disabled = false;
            addBtn.textContent = "Проанализировать через Gemini";
        }
    });

    calcNormBtn?.addEventListener("click", () => {
        const gender =
            document.querySelector('input[name="gender"]:checked')?.value;

        const age = Number($("user-age").value);
        const height = Number($("user-height").value);
        const weight = Number($("user-weight").value);

        if (
            !Number.isFinite(age) || age < 1 || age > 120 ||
            !Number.isFinite(height) || height < 50 || height > 250 ||
            !Number.isFinite(weight) || weight < 10 || weight > 300
        ) {
            alert("Проверь возраст, рост и вес.");
            return;
        }

        let bmr = 10 * weight + 6.25 * height - 5 * age;
        bmr += gender === "male" ? 5 : -161;

        bmrValueSpan.textContent = Math.round(bmr);
        document.querySelector(".norm-result").style.display = "block";
    });
});
