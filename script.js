"use strict";

const API_URL = "https://vercel.app";

// Глобальный массив для хранения съеденных продуктов
let diaryItems = [];

// ЛОКАЛЬНАЯ БАЗА ПРОДУКТОВ (КБЖУ указано на 100 г)
const FOOD_DATABASE = [
    { name: "Куриное филе (отварное)", kcal: 170, proteins: 30.0, fats: 5.0, carbs: 0.0 },
    { name: "Рис белый (отварной)", kcal: 130, proteins: 2.7, fats: 0.3, carbs: 28.0 },
    { name: "Гречка отварная", kcal: 110, proteins: 4.2, fats: 1.1, carbs: 21.3 },
    { name: "Яйцо куриное (1 шт ≈ 50г)", kcal: 155, proteins: 13.0, fats: 11.0, carbs: 1.1 },
    { name: "Овсяная каша на воде", kcal: 88, proteins: 3.0, fats: 1.7, carbs: 15.0 },
    { name: "Творог 5%", kcal: 121, proteins: 17.2, fats: 5.0, carbs: 2.8 },
    { name: "Банан", kcal: 89, proteins: 1.5, fats: 0.2, carbs: 21.8 },
    { name: "Яблоко", kcal: 52, proteins: 0.3, fats: 0.2, carbs: 13.8 },
    { name: "Стейк из лосося", kcal: 201, proteins: 20.0, fats: 13.0, carbs: 0.0 },
    { name: "Арахисовая паста", kcal: 588, proteins: 25.0, fats: 50.0, carbs: 20.0 }
];

document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);

    const addBtn = $("add-btn");
    const productInput = $("ai-product-input");
    const weightInput = $("product-weight");
    const diaryList = $("diary-list");
    const clearDiaryBtn = $("clear-diary-btn");

    const calcNormBtn = $("calc-norm-btn");
    const bmrValueSpan = $("bmr-value");
    const normResult = document.querySelector(".norm-result");

    const catalogSearch = $("catalog-search");
    const catalogList = $("catalog-list");

    // Элементы вкладок переключения режима ввода
    const tabCatalogBtn = $("tab-catalog-btn");
    const tabAiBtn = $("tab-ai-btn");
    const contentCatalog = $("content-catalog");
    const contentAi = $("content-ai");

    if (
        !addBtn || !productInput || !weightInput || !diaryList ||
        !$("total-kcal") || !$("total-proteins") ||
        !$("total-fats") || !$("total-carbs") ||
        !catalogSearch || !catalogList || !clearDiaryBtn ||
        !tabCatalogBtn || !tabAiBtn || !contentCatalog || !contentAi
    ) {
        console.error("Не найдены необходимые элементы HTML.");
        return;
    }

    // Инициализация сохраненных данных
    loadProfileFromStorage();
    loadDiaryFromStorage();
    renderCatalog();

    // ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ВКЛАДОК (ИНТЕРФЕЙСУ)
    tabCatalogBtn.addEventListener("click", () => {
        tabCatalogBtn.classList.add("active");
        tabAiBtn.classList.remove("active");
        contentCatalog.classList.add("active");
        contentAi.classList.remove("active");
    });

    tabAiBtn.addEventListener("click", () => {
        tabAiBtn.classList.add("active");
        tabCatalogBtn.classList.remove("active");
        contentAi.classList.add("active");
        contentCatalog.classList.remove("active");
    });

    // РЕНДЕР КАТАЛОГА ПРОДУКТОВ
    function renderCatalog(filterText = "") {
        catalogList.innerHTML = "";
        const query = filterText.toLowerCase().trim();

        const filtered = FOOD_DATABASE.filter(item => 
            item.name.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            catalogList.innerHTML = `<li class="catalog-item" style="color: #8d8d99;">Ничего не найдено</li>`;
            return;
        }

        filtered.forEach(item => {
            const li = document.createElement("li");
            li.className = "catalog-item";

            const infoDiv = document.createElement("div");
            infoDiv.className = "catalog-info";

            const title = document.createElement("span");
            title.textContent = item.name;

            const kbjuSpan = document.createElement("span");
            kbjuSpan.className = "kbju";
            kbjuSpan.textContent = `Ккал: ${item.kcal} | Б: ${item.proteins} | Ж: ${item.fats} | У: ${item.carbs}`;

            infoDiv.append(title, kbjuSpan);

            const addBtnCatalog = document.createElement("button");
            addBtnCatalog.className = "btn-catalog-add";
            addBtnCatalog.textContent = "+ ДОБАВИТЬ";

            // Клик по каталогу считывает текущий объем/вес, введенный пользователем лично
            addBtnCatalog.addEventListener("click", () => {
                const weight = Number(weightInput.value);
                if (!Number.isFinite(weight) || weight <= 0 || weight > 100000) {
                    alert("Укажите корректный вес или объем продукта перед добавлением.");
                    weightInput.focus();
                    return;
                }
                addDiaryItem(item.name, weight, item);
            });

            li.append(infoDiv, addBtnCatalog);
            catalogList.appendChild(li);
        });
    }

    catalogSearch.addEventListener("input", (e) => {
        renderCatalog(e.target.value);
    });

    // ЗАПРОС К GEMINI API
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
            throw new Error("Сервер вернул неправильный ответ. Проверь Vercel.");
        }

        if (!response.ok) {
            throw new Error(data.error || `Ошибка сервера: ${response.status}`);
        }

        for (const field of ["kcal", "proteins", "fats", "carbs"]) {
            if (typeof data[field] !== "number" || !Number.isFinite(data[field]) || data[field] < 0) {
                throw new Error("ИИ вернул некорректные значения КБЖУ.");
            }
        }

        return data;
    }

    // РАСЧЕТ И ДОБАВЛЕНИЕ ПОЛЬЗОВАТЕЛЬСКОГО ОБЪЕМА В ДНЕВНИК
    function addDiaryItem(product, weight, result) {
        const kcal = Math.round(result.kcal * weight / 100);
        const proteins = result.proteins * weight / 100;
        const fats = result.fats * weight / 100;
        const carbs = result.carbs * weight / 100;

        const newItem = { product, weight, kcal, proteins, fats, carbs, originalKcal: result.kcal };
        diaryItems.push(newItem);

        localStorage.setItem("diaryItems", JSON.stringify(diaryItems));
        updateDiaryUI();
    }

    // СИНХРОНИЗАЦИЯ ИНТЕРФЕЙСА ДНЕВНИКА
    function updateDiaryUI() {
        diaryList.innerHTML = "";

        let totalKcal = 0;
        let totalProteins = 0;
        let totalFats = 0;
        let totalCarbs = 0;

        diaryItems.forEach((item, index) => {
            const li = document.createElement("li");
            li.className = "diary-item";

            const description = document.createElement("div");

            const title = document.createElement("strong");
            title.textContent = `${item.product} — ${item.weight} г/мл`;

            const details = document.createElement("small");
            details.style.color = "#8d8d99";
            details.textContent =
                `Б: ${item.proteins.toFixed(1)} г | ` +
                `Ж: ${item.fats.toFixed(1)} г | ` +
                `У: ${item.carbs.toFixed(1)} г | ` +
                `${item.originalKcal} ккал на 100 г/мл`;

            const calories = document.createElement("span");
            calories.style.fontWeight = "bold";
            calories.style.color = "#00f5d4";
            calories.textContent = `+${item.kcal} ккал`;

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "✕";
            deleteBtn.style.cssText = "background:none; border:none; color:#ff2a7a; margin-left:15px; cursor:pointer; font-weight:bold; font-size:16px;";
            deleteBtn.addEventListener("click", () => {
                removeDiaryItem(index);
            });

            const rightSide = document.createElement("div");
            rightSide.style.cssText = "display:flex; align-items:center;";
            rightSide.append(calories, deleteBtn);

            description.append(title, document.createElement("br"), details);
            li.append(description, rightSide);
            diaryList.appendChild(li);

            totalKcal += item.kcal;
            totalProteins += item.proteins;
            totalFats += item.fats;
            totalCarbs += item.carbs;
        });

        $("total-kcal").textContent = totalKcal;
        $("total-proteins").textContent = totalProteins.toFixed(1);
        $("total-fats").textContent = totalFats.toFixed(1);
        $("total-carbs").textContent = totalCarbs.toFixed(1);
    }

    function removeDiaryItem(index) {
        diaryItems.splice(index, 1);
        localStorage.setItem("diaryItems", JSON.stringify(diaryItems));
        updateDiaryUI();
    }

    clearDiaryBtn.addEventListener("click", () => {
        if (diaryItems.length === 0) return;
        if (confirm("Вы уверены, что хотите полностью очистить дневник за сегодня?")) {
            diaryItems = [];
            localStorage.removeItem("diaryItems");
            updateDiaryUI();
        }
    });

    function loadDiaryFromStorage() {
        const saved = localStorage.getItem("diaryItems");
        if (saved) {
            try {
                diaryItems = JSON.parse(saved);
                updateDiaryUI();
            } catch (e) {
                console.error("Ошибка чтения дневника", e);
                diaryItems = [];
            }
        }
    }

    function calculateBMR() {
        const genderEl = document.querySelector('input[name="gender"]:checked');
        const gender = genderEl ? genderEl.value : "male";

        const age = Number($("user-age")?.value);
        const height = Number($("user-height")?.value);
        const weight = Number($("user-weight")?.value);

        if (
            !Number.isFinite(age) || age < 1 || age > 120 ||
            !Number.isFinite(height) || height < 50 || height > 250 ||
!Number.isFinite(weight) || weight < 10 || weight > 300
) {
alert("Проверь возраст, рост и вес.");
return null;
}
let bmr = 10 * weight + 6.25 * height - 5 * age;
bmr += gender === "male" ? 5 : -161;
const finalBmr = Math.round(bmr);
const profile = { gender, age, height, weight, bmr: finalBmr };
localStorage.setItem("userProfile", JSON.stringify(profile));
return finalBmr;
}
function loadProfileFromStorage() {
const saved = localStorage.getItem("userProfile");
if (saved) {
try {
const profile = JSON.parse(saved);
const maleRadio = document.querySelector('input[name="gender"][value="male"]');
const femaleRadio = document.querySelector('input[name="gender"][value="female"]');
if (profile.gender === "male" && maleRadio) maleRadio.checked = true;
if (profile.gender === "female" && femaleRadio) femaleRadio.checked = true;
if ($("user-age")) $("user-age").value = profile.age;
if ($("user-height")) $("user-height").value = profile.height;
if ($("user-weight")) $("user-weight").value = profile.weight;
if (bmrValueSpan) bmrValueSpan.textContent = profile.bmr;
if (normResult) normResult.style.display = "block";
} catch (e) {
console.error("Ошибка чтения профиля", e);
}
}
}
// ДОБАВЛЕНИЕ СЪЕДЕННОГО ЧЕРЕЗ ИИ
addBtn.addEventListener("click", async () => {
const product = productInput.value.trim();
const weight = Number(weightInput.value);
if (!product) {
alert("Введи название продукта для ИИ.");
productInput.focus();
return;
}
if (!Number.isFinite(weight) || weight <= 0 || weight > 100000) {
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
alert(error.message || "Не удалось связаться с ИИ. Попробуй ещё раз.");
} finally {
addBtn.disabled = false;
addBtn.textContent = "Проанализировать через Gemini";
}
});
calcNormBtn?.addEventListener("click", () => {
const bmr = calculateBMR();
if (bmr !== null) {
if (bmrValueSpan) bmrValueSpan.textContent = bmr;
if (normResult) normResult.style.display = "block";
}
});
});
