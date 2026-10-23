
const GEMINI_API_KEY = "AQ.Ab8RN6LnsX9pBftDrnblJAPj6df8OeKhGviflV5xnbo9-lMklg";
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

    async function askGemini(product) {
        if (
            !GEMINI_API_KEY ||
            GEMINI_API_KEY === "ВСТАВЬ_НОВЫЙ_API_KEY"
        ) {
            throw new Error("Сначала настрой API-ключ Gemini.");
        }

        const prompt = `
Ты помощник по подсчёту калорий.
Определи пищевую ценность указанного продукта на 100 г.
Для напитков используй значения на 100 мл.
Учитывай способ приготовления, если он указан.
Если запрос не связан с едой или напитками, верни:
{"error":"NOT_FOOD"}

Верни только JSON без Markdown:
{"kcal":число,"proteins":число,"fats":число,"carbs":число}

Все значения должны быть неотрицательными числами.
Продукт: ${product}
        `.trim();

        const response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY
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
        });

        if (!response.ok) {
            const details = await response.text();
            console.error("Gemini API:", response.status, details);

            if (response.status === 400) {
                throw new Error(
                    "Некорректный запрос. Проверь модель и настройки API."
                );
            }
            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    "Ошибка доступа. Проверь API-ключ и доступ к Gemini API."
                );
            }
            if (response.status === 429) {
                throw new Error(
                    "Превышен лимит запросов Gemini. Попробуй позже."
                );
            }

            throw new Error(`Ошибка Gemini API: ${response.status}`);
        }

        const data = await response.json();
        const answer = data.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

        if (!answer) {
            throw new Error(
                "Gemini не вернул ответ. Возможно, запрос был заблокирован."
            );
        }

        const result = JSON.parse(
            answer.replace(/^```json\s*/i, "")
                  .replace(/\s*```$/, "")
                  .trim()
        );

        if (result.error === "NOT_FOOD") {
            return null;
        }

        for (const field of ["kcal", "proteins", "fats", "carbs"]) {
            if (
                typeof result[field] !== "number" ||
                !Number.isFinite(result[field]) ||
                result[field] < 0
            ) {
                throw new Error("Gemini вернул некорректные данные.");
            }
        }

        if (
            result.kcal > 1000 ||
            result.proteins > 100 ||
            result.fats > 100 ||
            result.carbs > 100
        ) {
            throw new Error(
                "Получены подозрительные значения на 100 г продукта."
            );
        }

        return result;
    }

    addBtn?.addEventListener("click", async () => {
        const product = productInput.value.trim();
        const weight = Number(weightInput.value);

        if (!product || !Number.isFinite(weight) ||
            weight <= 0 || weight > 100000) {
            alert("Укажи название продукта и корректный вес.");
            return;
        }

        addBtn.disabled = true;
        addBtn.textContent = "Gemini анализирует...";

        try {
            const result = await askGemini(product);

            if (!result) {
                alert("Укажи конкретный продукт или напиток.");
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

            description.append(title, document.createElement("br"), details);
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
            alert(error.message || "Ошибка при обращении к Gemini.");
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
