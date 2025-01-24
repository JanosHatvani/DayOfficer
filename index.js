//első körben az adatok tárolására a localstorage lenne jó, de minden egyes alkalommal, amikor bezárásra kerül az alkalmazás
//vagy frissítésr kerül az oldal, újra betöltésre kerül a szabadság betöltő file
//a dátum formázását egyszerűsíteni kell illetve a dáum kinyerését az excelből. Nem futásidőben, szimplán logikában nem éppen értelmes, amit találtam erre.
//

// Az aktuális hónap deklarálás
let currentMonth = new Date().getMonth(); 
// Az aktuális év deklarálás
let currentYear = new Date().getFullYear(); 

// Események tárolása atóz excelből kinyert dátum-név-szabadság típus alapján
let events = [];

// Dátum formázása Excel-stílusból YYYY-MM-DD formátumba, ha netán nem a megfelelő formátumot használnák
function formatExcelDate(excelDate) {
    if (typeof excelDate === 'number') {
        // Excel dátumok átváltása (Excel dátumok kezdete 1900. január 1.)
        //kezdő dátum megállapítása
        const excelStartDate = new Date(1900, 0, 1);
        // Egy nap millisekundumban
        const msInDay = 86400000; 
        // Korrigáljuk a kezdő dátumot, azaz kiszámolásra kerül a kezdő dátumtól számítottan az aktuális nap
        const date = new Date(excelStartDate.getTime() + (excelDate - 2) * msInDay); 
        // YYYY-MM-DD formátumba rendezés
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

    calendar.innerHTML = "";
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    // Hónap nevek
    const monthNames = [
        "Január", "Február", "Március", "Április", "Május", "Június",
        "Július", "Augusztus", "Szeptember", "Október", "November", "December"
    ];
    //évszám meghatározás
    monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Kitöltés előző hónap napjaival
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement("div");
        emptyDay.classList.add("day", "outside");
        calendar.appendChild(emptyDay);
    }

    // Kitöltés aktuális hónap napjaival
    for (let day = 1; day <= totalDays; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day");
        dayDiv.innerHTML = `<strong>${day}</strong>`;

        const fullDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        // Hozzáadás eseményekhez
        events.forEach(event => {
            if (event.date === fullDate) {
                const eventDiv = document.createElement("div");
                eventDiv.classList.add(
                    "entry",
                    event.type === "szabadság"
                        ? "vacation"
                        : event.type === "betegszabadság"
                        ? "sick"
                        : "planned-vacation"
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
            // Csak a valid esemény kerül eltárolásra, ezzel megszűrve, hogy a 
        }).filter(event => event !== null); 

        console.log('Valós események listája:', events);
        renderCalendar(); // Naptár frissítése
    };

    reader.readAsArrayBuffer(file);
});

// Navigáció gombok a következő<=>előző illetve az aktuális hónaphoz
document.getElementById("prevMonth").addEventListener("click", () => {
    currentMonth = (currentMonth - 1 + 12) % 12;
    if (currentMonth === 11) currentYear--;
    renderCalendar();
});

document.getElementById("nextMonth").addEventListener("click", () => {
    currentMonth = (currentMonth + 1) % 12;
    if (currentMonth === 0) currentYear++;
    renderCalendar();
});

//évé s hónap meghatározása szükséges az adott hónaphoz való ugráshoz.
document.getElementById("currentMonthButton").addEventListener("click", () => {
    currentMonth = new Date().getMonth();
    currentYear = new Date().getFullYear();
    renderCalendar();
});

// Alapértelmezett render
renderCalendar(); // Az aktuális hónap betöltése
