'use strict';

/*
 * Лабораторная работа №3. Использование объектной модели документа (DOM).
 * Сценарий реализует:
 *  1) подсветку раздела страницы при выборе пункта меню;
 *  2) выделение тенью ячеек столбца таблицы при нажатии на его название;
 *  3) вывод содержимого элементов <aside> во всплывающем окне;
 *  4) обработку кнопок сброса и отправки опросной формы.
 */

// длительность цветовой подсветки полей формы, мс
const FLASH_TIME = 1000;

// цвета подсветки полей формы
const COLOR_RESET = '#ff5c5c';   // красный - форма очищена
const COLOR_CANCEL = '#5cd65c';  // зелёный - очистка отменена
const COLOR_SUBMIT = '#5c9dff';  // синий - данные отправлены

// запуск после построения DOM-дерева документа
document.addEventListener('DOMContentLoaded', function () {
    initMenuHighlight();
    initColumnShadow();
    initAsidePopups();
    initFormHandlers();
});


/* ---------- 1. Подсветка раздела при выборе пункта меню ---------- */

function initMenuHighlight() {
    // доступ к элементу по идентификатору
    const nav = document.getElementById('catNav');
    // доступ к группе элементов по CSS-селектору
    const links = nav.querySelectorAll('a.nav-link');

    // раздел, подсвеченный в данный момент
    let activeSection = null;

    links.forEach(function (link) {
        link.addEventListener('click', function () {
            // из href="#history" получаем id раздела "history"
            const sectionId = link.getAttribute('href').substring(1);
            const section = document.getElementById(sectionId);
            if (!section) {
                return;
            }

            // возвращаем начальный фон ранее выбранному разделу
            if (activeSection && activeSection !== section) {
                activeSection.classList.remove('section-selected');
            }

            // меняем фон выбранного раздела
            section.classList.add('section-selected');
            activeSection = section;
        });
    });
}


/* ---------- 2. Выделение столбца таблицы тенью ---------- */

function initColumnShadow() {
    const table = document.getElementById('breedTable');
    // названия столбцов - ячейки второй строки заголовка
    const headers = document.querySelectorAll('#breedHead th');
    // строки тела таблицы (коллекция rows объекта HTMLTableSectionElement)
    const rows = table.tBodies[0].rows;

    // номер выделенного столбца, -1 - выделения нет
    let activeIndex = -1;

    // включение / выключение тени у всех ячеек столбца с номером index
    function setColumnShadow(index, enabled) {
        for (let i = 0; i < rows.length; i++) {
            rows[i].cells[index].classList.toggle('column-shadow', enabled);
        }
        headers[index].classList.toggle('column-head-active', enabled);
    }

    headers.forEach(function (th, index) {
        th.addEventListener('click', function () {
            // снимаем текущее выделение (если оно есть)
            if (activeIndex !== -1) {
                setColumnShadow(activeIndex, false);
            }

            // повторное нажатие на тот же столбец - только снятие выделения
            if (activeIndex === index) {
                activeIndex = -1;
                return;
            }

            // выделяем новый столбец
            setColumnShadow(index, true);
            activeIndex = index;
        });
    });
}


/* ---------- 3. Вывод содержимого <aside> во всплывающем окне ---------- */

function initAsidePopups() {
    // доступ к элементам по имени тега
    const asides = document.getElementsByTagName('aside');

    for (let i = 0; i < asides.length; i++) {
        const aside = asides[i];

        aside.addEventListener('click', function () {
            const title = aside.querySelector('.aside-title');
            const text = aside.querySelector('.aside-text');

            // убираем лишние пробелы и переводы строк из разметки
            const titleText = title ? normalize(title.textContent) : '';
            const bodyText = text ? normalize(text.textContent) : normalize(aside.textContent);

            window.alert(titleText + '\n\n' + bodyText);
        });
    }
}

// схлопывание последовательностей пробельных символов
function normalize(str) {
    return str.replace(/\s+/g, ' ').trim();
}


/* ---------- 4. Обработка кнопок сброса и отправки формы ---------- */

function initFormHandlers() {
    // доступ к форме через коллекцию document.forms
    const form = document.forms['catForm'];
    if (!form) {
        return;
    }

    // поля формы из коллекции form.elements (без кнопок)
    const fields = Array.prototype.filter.call(form.elements, function (el) {
        return el.type !== 'submit' && el.type !== 'reset' && el.type !== 'button';
    });

    // таймер текущей подсветки
    let flashTimer = null;

    // установка цвета фона одного поля
    function paintField(field, color) {
        field.style.backgroundColor = color;
        // у флажка и ползунка фон почти не виден, поэтому дублируем цвет рамкой
        if (field.type === 'checkbox' || field.type === 'range') {
            field.style.outline = color ? '3px solid ' + color : '';
        }
    }

    // подсветка всех полей цветом color на FLASH_TIME мс,
    // после возврата начального фона вызывается afterFlash
    function flashFields(color, afterFlash) {
        clearTimeout(flashTimer);
        fields.forEach(function (field) {
            paintField(field, color);
        });

        flashTimer = setTimeout(function () {
            fields.forEach(function (field) {
                paintField(field, '');
            });
            if (afterFlash) {
                // ждём перерисовки страницы, чтобы окно появилось уже без подсветки
                requestAnimationFrame(function () {
                    setTimeout(afterFlash, 0);
                });
            }
        }, FLASH_TIME);
    }

    // кнопка сброса: событие reset возникает до очистки полей и может быть отменено
    form.addEventListener('reset', function (event) {
        const confirmed = window.confirm('Вы действительно хотите очистить анкету?');

        if (confirmed) {
            // сброс выполняется браузером, поля на секунду становятся красными
            flashFields(COLOR_RESET);
        } else {
            // отмена сброса, поля на секунду становятся зелёными
            event.preventDefault();
            flashFields(COLOR_CANCEL);
        }
    });

    // кнопка отправки
    form.addEventListener('submit', function (event) {
        // реальная отправка данных формы предотвращается
        event.preventDefault();

        // поля на секунду становятся синими, затем выводится сообщение
        flashFields(COLOR_SUBMIT, function () {
            window.alert('Данные анкеты отправлены!');
        });
    });
}
