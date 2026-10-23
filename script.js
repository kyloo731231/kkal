// Токен интеграции ИИ
const GEMINI_API_KEY = "AQ.Ab8RN6L9UVDupC2RKMbG5xsE6xWfvCN8gu9mCdz6XGFZbLT1kw"; 
// ИСПРАВЛЕННЫЙ ОФИЦИАЛЬНЫЙ АДРЕС: Все символы и знаки на своих местах
const GEMINI_API_URL = `https://googleapis.com{GEMINI_API_KEY}`;

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

    // Функция обращения к Google Gemini через чистый HTTP fetch
    async function askGoogleGemini(userInput) {
        const systemPrompt = `Ты — профессиональный ИИ-нутрициолог. Твоя задача — строго анализировать входящий текст.
        ПРАВИЛО МОДЕРАЦИИ: Если во входящем тексте написан бред (например, "аыаыаы"), случайный набор букв, нецензурная лексика или абсолютно несъедобные вещи, верни строго слово ERROR без каких-либо кавычек, скобок или знаков.
        ПРАВИЛО РАСЧЕТА: Если текст является реальной едой или напитком, определи её среднюю Ккал, Белки, Жиры, Углеводы строго на 100 грамм (или 100 мл) продукта. 
        Ответ выдай ИСКЛЮЧИТЕЛЬНО в формате чистого JSON-объекта, без markdown разметки и без обратных кавычек: {"kcal":число, "proteins":число, "fats":число, "carbs":число}`;

        const response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${systemPrompt}\n\nАнализируй запрос: ${userInput}` }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const data = await response.json();
        
        // ТОЧНОЕ ИСПРАВЛЕНИЕ: Добавлены корректные индексы массивов для структуры Google API
        const aiResponseText = data.candidates[0].content.parts[0].text.trim();
        console.log("Ответ от Gemini:", aiResponseText);

        if (aiResponseText.includes("ERROR") || aiResponseText === "ERROR") {
            return "REJECTED";
        }

        const cleanJsonString = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJsonString);
    }

    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const aiInputText = aiProductInput.value.trim();
            const weight = parseFloat(productWeightInput.value);

            if (!weight || weight <= 0) {
                alert("Введите корректный вес!");
                return;
            }

            if (!aiInputText) {
                alert("Напишите название продукта!");
                return;
            }

            addBtn.disabled = true;
            addBtn.textContent = "Gemini вычисляет...";

            try {
                const result = await askGoogleGemini(aiInputText);

                if (result === "REJECTED") {
                    alert("ИИ-Модерация Google: Запрос заблокирован! Обнаружен бессмысленный ввод или маты.");
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
                        <strong>[Gemini] ${aiInputText}</strong> — ${weight}г
                        <br><small style="color: #8d8d99">Б: ${calculatedProteins}г | Ж: ${calculatedFats}г | У: ${calculatedCarbs}г (на 100г: ${result.kcal} ккал)</small>
                    </div>
                    <span style="font-weight: bold; color: #00f5d4">+${calculatedKcal} ккал</span>
                `;
                diaryList.appendChild(listItem);

                totalKcal += calculatedKcal;
                totalProteins += calculatedProteins;
                totalFats += calculatedFats;
                totalCarbs += calculatedCarbs;

                kcalSpan.textContent = totalKcal;
                proteinsSpan.textContent = totalProteins.toFixed(1);
                fatsSpan.textContent = totalFats.toFixed(1);
                carbsSpan.textContent = totalCarbs.toFixed(1);

                aiProductInput.value = "";
                productWeightInput.value = 100;

            } catch (error) {
                console.error("Критическая ошибка:", error);
                alert("Произошла ошибка при связи с серверами Google Gemini AI.");
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
                alert("Заполните поля корректными числами!");
                return;
            }
            let bmr = (10 * weight) + (6.25 * height) - (5 * age);
            bmr += (gender === 'male') ? 5 : -161;

            bmrValueSpan.textContent = Math.round(bmr);
            document.querySelector('.norm-result').style.display = 'block';
        });
    }
});
