
// Az aktuális hónap deklarálás
let currentMonth = new Date().getMonth(); 
// Az aktuális év deklarálás
let currentYear = new Date().getFullYear(); 

// Események tárolása atóz excelből kinyert dátum-név-szabadság típus alapján
let events = [];

// Dátum formázása Excel-stílusból YYYY-MM-DD formátumba, ha netán nem a megfelelő formátumot használnák
function formatExcelDate(excelDate) {
    if (typeof excelDate === 'number') {
        const excelStartDate = new Date(1900, 0, 1);
        const msInDay = 86400000; 
        const date = new Date(excelStartDate.getTime() + (excelDate - 2) * msInDay); 
        return date.toISOString().split('T')[0]; 
    }
    return '';
}

// Naptár renderelése az eseményekkel
function renderCalendar() {
    const calendar = document.getElementById("calendar");
    const monthYear = document.getElementById("monthYear");

    if (!calendar || !monthYear) {
        console.error("Hiba: Naptár vagy hónap-év mező nem található.");
        return;
    }

    calendar.innerHTML = ""; // Naptár törlése

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7; // Hétfő legyen a kezdő nap
    const totalDays = lastDay.getDate();

    const dayNames = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];
    
    // Napok neveinek sora
    dayNames.forEach(day => {
        const dayHeader = document.createElement("div");
        dayHeader.classList.add("day-header"); // CSS az igazításhoz
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });

    // Üres helyek (nem aktuális napok előtt)
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement("div");
        emptyDay.classList.add("day", "outside");
        calendar.appendChild(emptyDay);
    }

    // Napok hozzáadása
    for (let day = 1; day <= totalDays; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day");
        dayDiv.innerHTML = `<strong>${day}</strong>`;

        const fullDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        monthYear.textContent = `${currentYear} ${new Date(currentYear, currentMonth).toLocaleDateString("hu-HU", { month: "long" })}`;


        events.forEach(event => {
            if (event.date === fullDate) {
                const eventDiv = document.createElement("div");
                eventDiv.classList.add(
                    "entry",
                    event.type === "szabadság" ? "vacation" :
                    event.type === "betegszabadság" ? "sick" : "planned-vacation"
                );
                eventDiv.textContent = event.name;
                dayDiv.appendChild(eventDiv);
            }
        });

        calendar.appendChild(dayDiv);
    }
}


// Fájl betöltése és események feldolgozása
document.getElementById("fileInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const [header, ...rows] = json;

        if (rows.length === 0) {
            alert('Nincs adat a fájlban!');
            return;
        }

        events = rows.map(row => {
            const date = formatExcelDate(row[0]);
            if (!date) {
                console.error('Érvénytelenül megadott dátum átugrása történt az alábbi szerint:', row[0]);
                return null;
            }
            return {
                date: date,
                name: row[1],
                type: row[2],
            };
        }).filter(event => event !== null); 

        renderCalendar();
    };

    reader.readAsArrayBuffer(file);
});

// Navigáció gombok a következő<=>előző illetve az aktuális hónaphoz
document.getElementById("prevMonth").addEventListener("click", () => {
    if (currentView === 'monthly') {
        currentMonth = (currentMonth - 1 + 12) % 12;
        if (currentMonth === 11) currentYear--;
        renderCalendar();
    } else if (currentView === 'weekly') {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        currentWeekEnd.setDate(currentWeekEnd.getDate() - 7);
        renderWeeklyView();
    }
});

document.getElementById("nextMonth").addEventListener("click", () => {
    if (currentView === 'monthly') {
        currentMonth = (currentMonth + 1) % 12;
        if (currentMonth === 0) currentYear++;
        renderCalendar();
    } else if (currentView === 'weekly') {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);
        renderWeeklyView();
    }
});

document.getElementById("currentMonthButton").addEventListener("click", () => {
    currentMonth = new Date().getMonth();
    currentYear = new Date().getFullYear();
    renderCalendar();
});

// Heti nézet aktiválása
let currentView = 'monthly'; // Alapértelmezett: havi nézet

let currentWeekStart = getStartOfWeek(new Date()); // A hét kezdete
let currentWeekEnd = new Date(currentWeekStart); // A hét vége (vasárnap)
currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

// A hét kezdő dátuma
function getStartOfWeek(date) {
    const day = date.getDay(),
          diff = date.getDate() - day + (day == 0 ? -6 : 1); 
    return new Date(date.setDate(diff));
}

document.getElementById("weeklyViewButton").addEventListener("click", () => {
    currentView = 'weekly'; // Heti nézet aktiválása
    currentWeekStart = getStartOfWeek(new Date()); 
    currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // Hét vége
    renderWeeklyView();
});

function renderWeeklyView() {
    const calendar = document.getElementById("calendar");
    const monthYear = document.getElementById("monthYear");

    calendar.innerHTML = "";

    // Napok neveinek megjelenítése
    const dayNames = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];
    dayNames.forEach(day => {
        const dayHeader = document.createElement("div");
        dayHeader.classList.add("day-header"); // CSS az igazításhoz
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });

    let day = new Date(currentWeekStart);
    while (day <= currentWeekEnd) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day");
        dayDiv.innerHTML = `<strong>${day.getDate()}</strong>`;

        const fullDate = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;

        events.forEach(event => {
            if (event.date === fullDate) {
                const eventDiv = document.createElement("div");
                eventDiv.classList.add(
                    "entry",
                    event.type === "szabadság" ? "vacation" :
                    event.type === "betegszabadság" ? "sick" : "planned-vacation"
                );
                eventDiv.textContent = event.name;
                dayDiv.appendChild(eventDiv);
            }
        });

        calendar.appendChild(dayDiv);
        day.setDate(day.getDate() + 1);
    }

    monthYear.textContent = `Hét: ${currentWeekStart.toLocaleDateString("hu-HU")} - ${currentWeekEnd.toLocaleDateString("hu-HU")}`;
}

document.getElementById("monthlyViewButton").addEventListener("click", () => {
    currentView = 'monthly'; // Havi nézet aktiválása
    renderCalendar();
});
document.addEventListener("DOMContentLoaded", renderCalendar);