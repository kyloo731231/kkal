
"use strict";

// Серверная функция Vercel.
// API-ключ Gemini здесь НЕ нужен!
const API_URL = "https://kkal-nine.vercel.app/api/analyze";

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

    const calcNormBtn = $("calc-norm-btn");
    const bmrValueSpan = $("bmr-value");
    const normResult = document.querySelector(".norm-result");

    // Проверяем, что необходимые элементы HTML существуют.
    if (
        !addBtn || !productInput || !weightInput || !diaryList ||
        !$("total-kcal") || !$("total-proteins") ||
        !$("total-fats") || !$("total-carbs")
    ) {
        console.error("Не найдены необходимые элементы HTML.");
        return;
    }

    // Обращение к Gemini через сервер Vercel.
    async function askGemini(product) {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ product })
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                "Сервер вернул неправильный ответ. Проверь Vercel."
            );
        }

        if (!response.ok) {
            throw new Error(
                data.error || `Ошибка сервера: ${response.status}`
            );
        }

        for (const field of ["kcal", "proteins", "fats", "carbs"]) {
            if (
                typeof data[field] !== "number" ||
                !Number.isFinite(data[field]) ||
                data[field] < 0
            ) {
                throw new Error(
                    "ИИ вернул некорректные значения КБЖУ."
                );
            }
        }

        return data;
    }

    // Безопасное создание записи дневника.
    function addDiaryItem(product, weight, result) {
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
            `У: ${carbs.toFixed(1)} г | ` +
            `${result.kcal} ккал на 100 г`;

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

        $("total-kcal").textContent = totalKcal;
        $("total-proteins").textContent = totalProteins.toFixed(1);
        $("total-fats").textContent = totalFats.toFixed(1);
        $("total-carbs").textContent = totalCarbs.toFixed(1);

        return { kcal, proteins, fats, carbs };
    }

    // Добавление продукта в дневник.
    addBtn.addEventListener("click", async () => {
        const product = productInput.value.trim();
        const weight = Number(weightInput.value);

        if (!product) {
            alert("Введи название продукта.");
            productInput.focus();
            return;
        }

        if (
            !Number.isFinite(weight) ||
            weight <= 0 ||
            weight > 100000
        ) {
            alert("Введи корректный вес или объём.");
            weightInput.focus();
            return;
        }

        addBtn.disabled = true;
        addBtn.textContent = "Gemini анализирует...";

        try {
            const result = await askGemini(product);

            addDiaryItem(product, weight, result);

            productInput.value = "";
            weightInput.value = "100";
            productInput.focus();

        } catch (error) {
            console.error("Ошибка анализа продукта:", error);

            alert(
                error.message ||
                "Не удалось связаться с ИИ. Попробуй ещё раз."
            );
        } finally {
            addBtn.disabled = false;
            addBtn.textContent = "Проанализировать через Gemini";
        }
    });

    // Расчёт базового обмена веществ по формуле Миффлина — Сан Жеора.
    calcNormBtn?.addEventListener("click", () => {
        const gender =
            document.querySelector(
                'input[name="gender"]:checked'
            )?.value;

        const age = Number($("user-age")?.value);
        const height = Number($("user-height")?.value);
        const weight = Number($("user-weight")?.value);

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

        if (bmrValueSpan) {
            bmrValueSpan.textContent = Math.round(bmr);
        }

        if (normResult) {
            normResult.style.display = "block";
        }
    });
});
