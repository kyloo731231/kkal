"use strict";

const API_URL = "https://vercel.app";

// Глобальный массив для хранения съеденных продуктов
let diaryItems = [];

// ЛОКАЛЬНАЯ БАЗА ПРОДУКТОВ (КБЖУ указано на 100 г)
// ОГРОМНАЯ ЛОКАЛЬНАЯ БАЗА ПРОДУКТОВ И НАПИТКОВ (КБЖУ на 100 г / 100 мл)
const FOOD_DATABASE = [
    // --- МЯСО, ПТИЦА И ЯЙЦА ---
    { name: "Куриное филе (отварное)", kcal: 170, proteins: 30.0, fats: 5.0, carbs: 0.0 },
    { name: "Куриная грудка (запеченная)", kcal: 150, proteins: 28.0, fats: 4.2, carbs: 0.0 },
    { name: "Говядина (отварная постная)", kcal: 254, proteins: 25.8, fats: 16.8, carbs: 0.0 },
    { name: "Свинина (запеченная нежирная)", kcal: 260, proteins: 23.0, fats: 18.0, carbs: 0.0 },
    { name: "Фарш домашний (говядина + свинина)", kcal: 263, proteins: 17.0, fats: 21.0, carbs: 0.0 },
    { name: "Индейка (филе отварное)", kcal: 130, proteins: 24.5, fats: 3.5, carbs: 0.0 },
    { name: "Яйцо куриное (1 шт ≈ 50г)", kcal: 155, proteins: 13.0, fats: 11.0, carbs: 1.1 },
    { name: "Белок куриного яйца", kcal: 44, proteins: 11.1, fats: 0.0, carbs: 1.0 },
    { name: "Желток куриного яйца", kcal: 352, proteins: 16.2, fats: 31.2, carbs: 1.0 },

    // --- РЫБА И МОРЕПРОДУКТЫ ---
    { name: "Стейк из лосося / семги", kcal: 201, proteins: 20.0, fats: 13.0, carbs: 0.0 },
    { name: "Горбуша (запеченная)", kcal: 142, proteins: 21.0, fats: 6.5, carbs: 0.0 },
    { name: "Треска (на пару)", kcal: 78, proteins: 17.8, fats: 0.7, carbs: 0.0 },
    { name: "Тунец консервированный (в собств. соку)", kcal: 96, proteins: 21.0, fats: 1.2, carbs: 0.0 },
    { name: "Креветки (отварные)", kcal: 95, proteins: 19.0, fats: 2.1, carbs: 0.0 },
    { name: "Кальмары (отварные)", kcal: 122, proteins: 21.2, fats: 2.8, carbs: 2.0 },

    // --- ГАРНИРЫ, КРУПЫ И КАРТОФЕЛЬ (в готовом виде) ---
    { name: "Рис белый (отварной)", kcal: 130, proteins: 2.7, fats: 0.3, carbs: 28.0 },
    { name: "Рис бурый / дикий (отварной)", kcal: 110, proteins: 2.6, fats: 0.9, carbs: 23.0 },
    { name: "Гречка отварная", kcal: 110, proteins: 4.2, fats: 1.1, carbs: 21.3 },
    { name: "Макароны твердых сортов (отварные)", kcal: 140, proteins: 5.0, fats: 0.5, carbs: 28.0 },
    { name: "Овсяная каша на воде", kcal: 88, proteins: 3.0, fats: 1.7, carbs: 15.0 },
    { name: "Овсяная каша на молоке 2.5%", kcal: 102, proteins: 3.2, fats: 2.5, carbs: 16.0 },
    { name: "Булгур отварной", kcal: 83, proteins: 3.0, fats: 0.2, carbs: 14.1 },
    { name: "Картофельное пюре (на молоке с маслом)", kcal: 106, proteins: 2.0, fats: 4.8, carbs: 14.5 },
    { name: "Картофель запеченный", kcal: 85, proteins: 2.0, fats: 0.1, carbs: 19.0 },

    // --- МОЛОЧНЫЕ ПРОДУКТЫ И СЫРЫ ---
    { name: "Творог 0% (обезжиренный)", kcal: 78, proteins: 16.5, fats: 0.2, carbs: 1.8 },
    { name: "Творог 5%", kcal: 121, proteins: 17.2, fats: 5.0, carbs: 2.8 },
    { name: "Творог 9%", kcal: 159, proteins: 16.0, fats: 9.0, carbs: 3.0 },
    { name: "Молоко 2.5%", kcal: 54, proteins: 2.9, fats: 2.5, carbs: 4.8 },
    { name: "Молоко 3.2%", kcal: 60, proteins: 2.9, fats: 3.2, carbs: 4.7 },
    { name: "Кефир 1%", kcal: 40, proteins: 2.8, fats: 1.0, carbs: 4.0 },
    { name: "Йогурт натуральный 2% (без сахара)", kcal: 60, proteins: 5.0, fats: 2.0, carbs: 3.5 },
    { name: "Сыр Российский / Голландский 45%", kcal: 350, proteins: 25.0, fats: 26.0, carbs: 0.0 },
    { name: "Сыр Моцарелла", kcal: 240, proteins: 18.0, fats: 18.0, carbs: 1.0 },

    // --- ОВОЩИ И ЗЕЛЕНЬ ---
    { name: "Огурцы свежие", kcal: 15, proteins: 0.8, fats: 0.1, carbs: 2.8 },
    { name: "Помидоры свежие", kcal: 20, proteins: 0.6, fats: 0.2, carbs: 4.2 },
    { name: "Капуста белокочанная", kcal: 27, proteins: 1.8, fats: 0.1, carbs: 4.7 },
    { name: "Салат айсберг / листья салата", kcal: 14, proteins: 0.9, fats: 0.1, carbs: 1.8 },
    { name: "Перец болгарский", kcal: 27, proteins: 1.3, fats: 0.1, carbs: 5.3 },
    { name: "Брокколи (на пару)", kcal: 35, proteins: 2.8, fats: 0.4, carbs: 4.0 },

    // --- ФРУКТЫ И ЯГОДЫ ---
    { name: "Банан", kcal: 89, proteins: 1.5, fats: 0.2, carbs: 21.8 },
    { name: "Яблоко", kcal: 52, proteins: 0.3, fats: 0.2, carbs: 13.8 },
    { name: "Апельсин", kcal: 43, proteins: 0.9, fats: 0.2, carbs: 8.1 },
    { name: "Грейпфрут", kcal: 35, proteins: 0.7, fats: 0.2, carbs: 6.5 },
    { name: "Клубника", kcal: 33, proteins: 0.8, fats: 0.4, carbs: 7.5 },
    { name: "Авокадо", kcal: 160, proteins: 2.0, fats: 14.7, carbs: 6.7 },

    // --- ОРЕХИ И МАСЛА ---
    { name: "Арахисовая паста", kcal: 588, proteins: 25.0, fats: 50.0, carbs: 20.0 },
    { name: "Орехи грецкие", kcal: 654, proteins: 15.2, fats: 65.2, carbs: 7.0 },
    { name: "Миндаль", kcal: 645, proteins: 18.6, fats: 57.7, carbs: 13.6 },
    { name: "Масло оливковое / подсолнечное", kcal: 899, proteins: 0.0, fats: 99.9, carbs: 0.0 },
    { name: "Масло сливочное 82.5%", kcal: 748, proteins: 0.5, fats: 82.5, carbs: 0.8 },

    // --- ХЛЕБ И ВЫПЕЧКА ---
    { name: "Хлеб белый пшеничный", kcal: 242, proteins: 8.1, fats: 1.0, carbs: 48.8 },
    { name: "Хлеб ржаной / бородинский", kcal: 210, proteins: 6.8, fats: 1.3, carbs: 40.0 },
    { name: "Хлебцы цельнозерновые (1 шт ≈ 10г)", kcal: 300, proteins: 11.0, fats: 2.5, carbs: 58.0 },

    // --- ФАСТФУД И СЛАДОСТИ ---
    { name: "Бургер классический (средний)", kcal: 250, proteins: 13.0, fats: 10.0, carbs: 27.0 },
    { name: "Картофель фри", kcal: 312, proteins: 3.4, fats: 15.0, carbs: 38.0 },
    { name: "Пицца Пепперони", kcal: 274, proteins: 11.5, fats: 12.1, carbs: 29.7 },
    { name: "Шоколад молочный", kcal: 550, proteins: 6.9, fats: 34.0, carbs: 54.0 },
    { name: "Шоколад горький 70%", kcal: 539, proteins: 6.2, fats: 35.4, carbs: 48.2 },

    // --- НАПИТКИ ---
    { name: "Кока-Кола (классическая)", kcal: 42, proteins: 0.0, fats: 0.0, carbs: 10.6 },
    { name: "Кола Зеро / Без сахара", kcal: 0, proteins: 0.0, fats: 0.0, carbs: 0.0 },
    { name: "Сок апельсиновый (пакетированный)", kcal: 45, proteins: 0.7, fats: 0.2, carbs: 10.2 },
    { name: "Кофе капучино (без сахара)", kcal: 35, proteins: 1.8, fats: 1.5, carbs: 2.8 },
    { name: "Пиво светлое 4.5%", kcal: 43, proteins: 0.5, fats: 0.0, carbs: 3.8 }
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
