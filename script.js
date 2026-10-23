// Авторизационный токен для работы с нейросетью Yandex GPT
const YANDEX_API_KEY = "AQVN1_xWfvCN8gu9mCdz6XGFZbLT1kw_DEMO_KEY"; 
const YANDEX_API_URL = "https://yandex.net";

let totalKcal = 0, totalProteins = 0, totalFats = 0, totalCarbs = 0;

document.addEventListener("DOMContentLoaded", () => {
    const addBtn = document.getElementById('add-btn');
    const productWeightInput = document.getElementById('product-weight');
    const aiProductInput = document.getElementById('ai-product-input');
    const diaryList = document.getElementById('diary-list');

    const kcalSpan = document.getElementById('total-kcal');
    const proteinsSpan = document.getElementById('total-proteins');
    const fatsSpan = document.getElementById('total-fats');
    const carbsSpan = document.getElementById('total-carbs');

    const calcNormBtn = document.getElementById('calc-norm-btn');
    const bmrValueSpan = document.getElementById('bmr-value');

    // Функция обращения к настоящему ИИ Yandex GPT
    async function askYandexAI(userInput) {
        const systemPrompt = `Ты — ИИ нутрициолог. ПРАВИЛО: Если пользователь ввел бред (аыаыаы) или мат, верни строго слово ERROR. Если введена еда, определи Ккал, Белки, Жиры, Углеводы строго на 100 грамм продукта. Ответ выведи ТОЛЬКО в формате чистого JSON: {"kcal":число, "proteins":число, "fats":число, "carbs":число}`;

        const response = await fetch(YANDEX_API_URL, {
            method: "POST",
            headers: {
                "Authorization": "Api-Key " + YANDEX_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                modelUri: "gpt://b1g1xxxxxx/yandexgpt-lite", // Идентификатор модели
                completionOptions: { stream: false, temperature: 0.1 },
                messages: [
                    { role: "system", text: systemPrompt },
                    { role: "user", text: userInput }
                ]
            })
        });

        if (!response.ok) throw new Error("Сбой сервера Yandex");

        const data = await response.json();
        
        // Стабильное извлечение текста ответа ИИ без риска опечаток в массивах
        const aiResponseText = data.result.alternatives[0].message.text.trim();
        console.log("Ответ от Yandex GPT:", aiResponseText);

        if (aiResponseText.includes("ERROR")) {
            return "REJECTED";
        }

        const cleanJsonString = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJsonString);
    }

    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const aiInputText = aiProductInput.value.trim();
            const weight = parseFloat(productWeightInput.value);

            if (!weight || weight <= 0 || !aiInputText) {
                alert("Заполните поля корректно!");
                return;
            }

            addBtn.disabled = true;
            addBtn.textContent = "ИИ вычисляет...";

            try {
                // Запуск настоящей нейросети
                const result = await askYandexAI(aiInputText);

                if (result === "REJECTED") {
                    alert("ИИ заблокировал запрос (бред/маты/не еда)!");
                    return;
                }

                const calculatedKcal = Math.round((result.kcal * weight) / 100);
                const calculatedProteins = parseFloat(((result.proteins * weight) / 100).toFixed(1));
                const calculatedFats = parseFloat(((result.fats * weight) / 100).toFixed(1));
                const calculatedCarbs = parseFloat(((result.carbs * weight) / 100).toFixed(1));

                const listItem = document.createElement('li');
                listItem.className = 'diary-item';
                listItem.innerHTML = `
                    <div>
                        <strong>[Yandex GPT] ${aiInputText}</strong> — ${weight}г
                        <br><small style="color: #8d8d99">Б: ${calculatedProteins}г | Ж: ${calculatedFats}г | У: ${calculatedCarbs}г (на 100г: ${result.kcal} ккал)</small>
                    </div>
                    <span style="font-weight: bold; color: #00f5d4">+${calculatedKcal} ккал</span>
                `;
                diaryList.appendChild(listItem);

                totalKcal += calculatedKcal; totalProteins += calculatedProteins; totalFats += calculatedFats; totalCarbs += calculatedCarbs;
                kcalSpan.textContent = totalKcal; proteinsSpan.textContent = totalProteins.toFixed(1); fatsSpan.textContent = totalFats.toFixed(1); carbsSpan.textContent = totalCarbs.toFixed(1);
                aiProductInput.value = ""; productWeightInput.value = 100;

            } catch (error) {
                console.error(error);
                alert("Произошла ошибка при связи с серверами ИИ.");
            } finally {
                addBtn.disabled = false;
                addBtn.textContent = "Проанализировать через Gemini";
            }
        });
    }

    if (calcNormBtn) {
        calcNormBtn.addEventListener('click', () => {
            const gender = document.querySelector('input[name="gender"]:checked').value;
            const age = parseInt(document.getElementById('user-age').value);
            const height = parseInt(document.getElementById('user-height').value);
            const weight = parseInt(document.getElementById('user-weight').value);

            if (!age || age <= 0 || !height || height <= 0 || !weight || weight <= 0) {
                alert("Заполните поля числами!");
                return;
            }
            let bmr = (10 * weight) + (6.25 * height) - (5 * age);
            bmr += (gender === 'male') ? 5 : -161;
            bmrValueSpan.textContent = Math.round(bmr);
            document.querySelector('.norm-result').style.display = 'block';
        });
    }
});
