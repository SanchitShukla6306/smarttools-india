
const toolArea = document.getElementById("tool-area");
const toolTitle = document.getElementById("tool-title");
const toolContent = document.getElementById("tool-content");
const result = document.getElementById("result");

function showTool(title, html) {
    toolArea.hidden = false;
    toolTitle.textContent = title;
    toolContent.innerHTML = html;
    result.textContent = "";
}

document.querySelectorAll(".tool-card").forEach(button => {
    button.addEventListener("click", () => {
        const tool = button.dataset.tool;

        if (tool === "calculator") {
    showTool("🧮 Scientific Calculator", `
        <div class="calc-app">
            <div class="calc-top">
                <span>SCIENTIFIC CALCULATOR</span>
                <button type="button" id="calc-angle">DEG</button>
            </div>

            <div class="calc-display">
                <div id="calc-expression">Ready</div>
                <input id="calc-screen" type="text"
                    placeholder="0" readonly aria-label="Calculator display">
            </div>

            <div class="calc-memory">
                <button type="button" data-calc="MC">MC</button>
                <button type="button" data-calc="MR">MR</button>
                <button type="button" data-calc="MPLUS">M+</button>
                <button type="button" data-calc="MMINUS">M−</button>
                <button type="button" data-calc="HISTORY">History</button>
            </div>

            <div class="calc-grid">
                <button type="button" data-calc="sin">sin</button>
                <button type="button" data-calc="cos">cos</button>
                <button type="button" data-calc="tan">tan</button>
                <button type="button" data-calc="log">log</button>
                <button type="button" data-calc="ln">ln</button>

                <button type="button" data-calc="(">(</button>
                <button type="button" data-calc=")">)</button>
                <button type="button" data-calc="pi">π</button>
                <button type="button" data-calc="e">e</button>
                <button type="button" data-calc="sqrt">√</button>

                <button type="button" data-calc="7">7</button>
                <button type="button" data-calc="8">8</button>
                <button type="button" data-calc="9">9</button>
                <button type="button" data-calc="/">÷</button>
                <button type="button" data-calc="DEL">DEL</button>

                <button type="button" data-calc="4">4</button>
                <button type="button" data-calc="5">5</button>
                <button type="button" data-calc="6">6</button>
                <button type="button" data-calc="*">×</button>
                <button type="button" data-calc="AC">AC</button>

                <button type="button" data-calc="1">1</button>
                <button type="button" data-calc="2">2</button>
                <button type="button" data-calc="3">3</button>
                <button type="button" data-calc="-">−</button>
                <button type="button" data-calc="^">xʸ</button>

                <button type="button" data-calc="0">0</button>
                <button type="button" data-calc=".">.</button>
                <button type="button" data-calc="%">%</button>
                <button type="button" data-calc="+">+</button>
                <button type="button" data-calc="!">x!</button>

                <button type="button" data-calc="square">x²</button>
                <button type="button" data-calc="cube">x³</button>
                <button type="button" data-calc="reciprocal">1/x</button>
                <button type="button" data-calc="ANS">ANS</button>
                <button type="button" data-calc="=" class="calc-equals">=</button>
            </div>

            <div class="calc-bottom">
                <button type="button" data-calc="COPY">📋 Copy Result</button>
                <button type="button" data-calc="CLEARHISTORY">Clear History</button>
            </div>

            <div id="calc-history" hidden></div>
        </div>
    `);

    const screen = document.getElementById("calc-screen");
    const expressionLabel = document.getElementById("calc-expression");
    const angleButton = document.getElementById("calc-angle");
    const historyBox = document.getElementById("calc-history");

    let expression = "";
    let memory = 0;
    let lastAnswer = 0;
    let angleMode = "DEG";
    let justCalculated = false;
    let history = [];

    function updateScreen() {
        screen.value = expression;
    }

    function formatNumber(number) {
        if (!Number.isFinite(number)) {
            throw new Error("Result is outside the supported range.");
        }

        if (Object.is(number, -0)) number = 0;

        return Number(number.toPrecision(12)).toString();
    }

    // Safe mathematical parser: eval() is not used.
    function calculate(input) {
        const source = input.replace(/\s+/g, "");
        let position = 0;

        function peek() {
            return source[position];
        }

        function consume(char) {
            if (source[position] === char) {
                position++;
                return true;
            }
            return false;
        }

        function number() {
            const rest = source.slice(position);
            const match = rest.match(
                /^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i
            );

            if (!match) {
                throw new Error("Invalid expression.");
            }

            position += match[0].length;
            return Number(match[0]);
        }

        function factorial(n) {
            if (!Number.isInteger(n) || n < 0 || n > 170) {
                throw new Error("Factorial supports integers from 0 to 170.");
            }

            let answer = 1;
            for (let i = 2; i <= n; i++) answer *= i;
            return answer;
        }

        function primary() {
            if (consume("+")) return unary();
            if (consume("-")) return -unary();

            if (consume("(")) {
                const value = addSub();
                if (!consume(")")) {
                    throw new Error("Missing closing bracket.");
                }
                return value;
            }

            const rest = source.slice(position);

            const functionMatch = rest.match(
                /^(sin|cos|tan|asin|acos|atan|sqrt|log|ln|abs|floor|ceil|round|min|max|pow|exp)(?=\()/i
            );

            if (functionMatch) {
                const name = functionMatch[1].toLowerCase();
                position += functionMatch[0].length;
                consume("(");

                const args = [addSub()];

                while (consume(",")) {
                    args.push(addSub());
                }

                if (!consume(")")) {
                    throw new Error("Missing function bracket.");
                }

                const a = args[0];
                const toRadians = x =>
                    angleMode === "DEG" ? x * Math.PI / 180 : x;
                const fromRadians = x =>
                    angleMode === "DEG" ? x * 180 / Math.PI : x;

                switch (name) {
                    case "sin": return Math.sin(toRadians(a));
                    case "cos": return Math.cos(toRadians(a));
                    case "tan":
                        if (Math.abs(Math.cos(toRadians(a))) < 1e-12) {
                            throw new Error("tan is undefined at this angle.");
                        }
                        return Math.tan(toRadians(a));
                    case "asin": return fromRadians(Math.asin(a));
                    case "acos": return fromRadians(Math.acos(a));
                    case "atan": return fromRadians(Math.atan(a));
                    case "sqrt":
                        if (a < 0) throw new Error("Square root needs a non-negative number.");
                        return Math.sqrt(a);
                    case "log":
                        if (a <= 0) throw new Error("log needs a positive number.");
                        return Math.log10(a);
                    case "ln":
                        if (a <= 0) throw new Error("ln needs a positive number.");
                        return Math.log(a);
                    case "abs": return Math.abs(a);
                    case "floor": return Math.floor(a);
                    case "ceil": return Math.ceil(a);
                    case "round": return Math.round(a);
                    case "exp": return Math.exp(a);
                    case "min": return Math.min(...args);
                    case "max": return Math.max(...args);
                    case "pow":
                        if (args.length !== 2) throw new Error("pow needs two values.");
                        return Math.pow(args[0], args[1]);
                }
            }

            if (consume("π")) return Math.PI;
            if (consume("e")) return Math.E;

            if (/\d|\./.test(peek() || "")) return number();

            throw new Error("Check the expression.");
        }

        function postfix() {
            let value = primary();

            while (true) {
                if (consume("!")) {
                    value = factorial(value);
                } else if (consume("%")) {
                    value /= 100;
                } else {
                    break;
                }
            }

            return value;
        }

        function power() {
            let value = postfix();

            if (consume("^")) {
                value = Math.pow(value, unary());
            }

            return value;
        }

        function unary() {
            if (consume("+")) return unary();
            if (consume("-")) return -unary();
            return power();
        }

        function multiplyDivide() {
            let value = unary();

            while (peek() === "*" || peek() === "/") {
                const op = source[position++];
                const right = unary();

                if (op === "/" && right === 0) {
                    throw new Error("Cannot divide by zero.");
                }

                value = op === "*" ? value * right : value / right;
            }

            return value;
        }

        function addSub() {
            let value = multiplyDivide();

            while (peek() === "+" || peek() === "-") {
                const op = source[position++];
                const right = multiplyDivide();
                value = op === "+" ? value + right : value - right;
            }

            return value;
        }

        if (!source) throw new Error("Enter a calculation first.");

        const answer = addSub();

        if (position !== source.length) {
            throw new Error("Invalid expression. Check your operators.");
        }

        if (!Number.isFinite(answer)) {
            throw new Error("This calculation has no finite result.");
        }

        return answer;
    }

    function getAnswer() {
        if (!expression) throw new Error("Enter a calculation first.");
        return calculate(expression);
    }

    function renderHistory() {
        historyBox.replaceChildren();

        if (!history.length) {
            historyBox.textContent = "No calculations yet.";
            return;
        }

        history.slice().reverse().forEach(item => {
            const row = document.createElement("button");
            row.type = "button";
            row.className = "calc-history-item";
            row.textContent = `${item.expression} = ${item.answer}`;

            row.addEventListener("click", () => {
                expression = String(item.answer);
                justCalculated = true;
                expressionLabel.textContent = item.expression;
                updateScreen();
            });

            historyBox.appendChild(row);
        });
    }

    function addValue(value) {
        if (justCalculated) {
            if (/^[0-9.]$/.test(value) || value === "π" || value === "e") {
                expression = "";
            }
            justCalculated = false;
        }

        expression += value;
        updateScreen();
    }

    function runAction(action) {
        try {
            switch (action) {
                case "AC":
                    expression = "";
                    expressionLabel.textContent = "Ready";
                    result.textContent = "";
                    justCalculated = false;
                    updateScreen();
                    return;

                case "DEL":
                    expression = expression.slice(0, -1);
                    justCalculated = false;
                    updateScreen();
                    return;

                case "=": {
                    const oldExpression = expression;
                    const answer = getAnswer();
                    lastAnswer = answer;

                    const formatted = formatNumber(answer);
                    expression = formatted;
                    expressionLabel.textContent = oldExpression + " =";
                    result.textContent = "Result: " + formatted;
                    justCalculated = true;

                    history.push({
                        expression: oldExpression,
                        answer: formatted
                    });

                    if (history.length > 50) history.shift();
                    renderHistory();
                    updateScreen();
                    return;
                }

                case "DEG":
                case "RAD":
                    angleMode = angleMode === "DEG" ? "RAD" : "DEG";
                    angleButton.textContent = angleMode;
                    return;

                case "MC":
                    memory = 0;
                    result.textContent = "Memory cleared.";
                    return;

                case "MR":
                    addValue(formatNumber(memory));
                    return;

                case "MPLUS":
                    memory += getAnswer();
                    result.textContent = "Added to memory.";
                    return;

                case "MMINUS":
                    memory -= getAnswer();
                    result.textContent = "Subtracted from memory.";
                    return;

                case "ANS":
                    addValue(formatNumber(lastAnswer));
                    return;

                case "HISTORY":
                    historyBox.hidden = !historyBox.hidden;
                    renderHistory();
                    return;

                case "CLEARHISTORY":
                    history = [];
                    renderHistory();
                    result.textContent = "History cleared.";
                    return;

                case "COPY":
                    navigator.clipboard.writeText(screen.value)
                        .then(() => {
                            result.textContent = "Result copied.";
                        })
                        .catch(() => {
                            result.textContent =
                                "Copy unavailable. Select and copy the result manually.";
                        });
                    return;

                case "square":
                    expression = `(${expression})^2`;
                    justCalculated = false;
                    updateScreen();
                    return;

                case "cube":
                    expression = `(${expression})^3`;
                    justCalculated = false;
                    updateScreen();
                    return;

                case "reciprocal":
                    expression = `1/(${expression})`;
                    justCalculated = false;
                    updateScreen();
                    return;

                case "sqrt":
                    addValue("sqrt(");
                    return;

                case "pi":
                    addValue("π");
                    return;

                case "sin":
                case "cos":
                case "tan":
                case "log":
                case "ln":
                    addValue(action + "(");
                    return;

                default:
                    addValue(action);
            }
        } catch (error) {
            result.textContent = error.message || "Unable to calculate.";
        }
    }

    toolContent.querySelectorAll("[data-calc]").forEach(button => {
        button.addEventListener("click", () => {
            runAction(button.dataset.calc);
        });
    });

    angleButton.addEventListener("click", () => {
        runAction(angleMode);
    });

    screen.addEventListener("keydown", event => {
        event.preventDefault();
    });

    document.onkeydown = event => {
        if (toolArea.hidden || !toolContent.contains(screen)) return;

        if (/^[0-9.+\-*/^()%]$/.test(event.key)) {
            event.preventDefault();
            runAction(event.key);
        } else if (event.key === "Enter" || event.key === "=") {
            event.preventDefault();
            runAction("=");
        } else if (event.key === "Backspace") {
            event.preventDefault();
            runAction("DEL");
        } else if (event.key === "Escape") {
            event.preventDefault();
            runAction("AC");
        }
    };

    updateScreen();
}

if (tool === "converter") {
    showTool("📏 Unit Converter", `
        <label for="unit-category">Select category</label>
        <select id="unit-category">
            <option value="length">Length</option>
            <option value="weight">Weight</option>
            <option value="temperature">Temperature</option>
            <option value="speed">Speed</option>
            <option value="volume">Volume</option>
        </select>

        <label for="unit-value">Enter value</label>
        <input id="unit-value" type="number" step="any" value="1">

        <label for="unit-from">From</label>
        <select id="unit-from"></select>

        <label for="unit-to">To</label>
        <select id="unit-to"></select>

        <button class="action-button" id="convert-unit">
            Convert
        </button>

        <button class="action-button" id="swap-units">
            ⇅ Swap Units
        </button>

        <div id="unit-output" aria-live="polite"
             style="margin-top:20px; font-size:20px; font-weight:bold;">
        </div>
    `);

    const category = document.getElementById("unit-category");
    const valueInput = document.getElementById("unit-value");
    const fromSelect = document.getElementById("unit-from");
    const toSelect = document.getElementById("unit-to");
    const output = document.getElementById("unit-output");

    const units = {
        length: {
            "Millimeter (mm)": 0.001,
            "Centimeter (cm)": 0.01,
            "Meter (m)": 1,
            "Kilometer (km)": 1000,
            "Inch (in)": 0.0254,
            "Foot (ft)": 0.3048,
            "Yard (yd)": 0.9144,
            "Mile (mi)": 1609.344
        },
        weight: {
            "Milligram (mg)": 0.000001,
            "Gram (g)": 0.001,
            "Kilogram (kg)": 1,
            "Metric tonne (t)": 1000,
            "Ounce (oz)": 0.028349523125,
            "Pound (lb)": 0.45359237
        },
        temperature: {
            "Celsius (°C)": "C",
            "Fahrenheit (°F)": "F",
            "Kelvin (K)": "K"
        },
        speed: {
            "Meters/second (m/s)": 1,
            "Kilometers/hour (km/h)": 1 / 3.6,
            "Miles/hour (mph)": 0.44704,
            "Knots (kn)": 0.514444
        },
        volume: {
            "Milliliter (mL)": 0.001,
            "Liter (L)": 1,
            "Cubic meter (m³)": 1000,
            "US gallon (gal)": 3.785411784,
            "US cup": 0.2365882365
        }
    };

    function fillUnits() {
        const options = Object.keys(units[category.value]);

        fromSelect.replaceChildren();
        toSelect.replaceChildren();

        options.forEach((name, index) => {
            fromSelect.add(new Option(name, name));
            toSelect.add(new Option(name, name, false, index === 1));
        });

        if (options.length > 1) {
            toSelect.selectedIndex = 1;
        }

        convert();
    }

    function convertTemperature(value, from, to) {
        let celsius;

        if (from === "Celsius (°C)") celsius = value;
        else if (from === "Fahrenheit (°F)") {
            celsius = (value - 32) * 5 / 9;
        } else {
            celsius = value - 273.15;
        }

        if (to === "Celsius (°C)") return celsius;
        if (to === "Fahrenheit (°F)") return celsius * 9 / 5 + 32;
        return celsius + 273.15;
    }

    function convert() {
        const rawValue = valueInput.value;

        if (rawValue.trim() === "") {
            output.textContent = "Please enter a value.";
            return;
        }

        const value = Number(rawValue);

        if (!Number.isFinite(value)) {
            output.textContent = "Please enter a valid number.";
            return;
        }

        const from = fromSelect.value;
        const to = toSelect.value;

        let answer;

        if (category.value === "temperature") {
            answer = convertTemperature(value, from, to);
        } else {
            const factors = units[category.value];
            answer = value * factors[from] / factors[to];
        }

        if (!Number.isFinite(answer)) {
            output.textContent = "Unable to convert this value.";
            return;
        }

        const formatted = Number(answer.toPrecision(10)).toString();
        output.textContent = `${value} ${from} = ${formatted} ${to}`;
    }

    category.addEventListener("change", fillUnits);
    document.getElementById("convert-unit").addEventListener("click", convert);

    document.getElementById("swap-units").addEventListener("click", () => {
        const oldFrom = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = oldFrom;
        convert();
    });

    valueInput.addEventListener("input", convert);
    fromSelect.addEventListener("change", convert);
    toSelect.addEventListener("change", convert);

    fillUnits();
}

if (tool === "currency") {
    showTool("💱 Live Currency Converter", `
        <label for="currency-amount">Amount</label>
        <input id="currency-amount" type="number"
            min="0" step="any" value="1" placeholder="Enter amount">

        <label for="currency-from">From currency</label>
        <select id="currency-from">
            <option value="INR">INR - Indian Rupee</option>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="AED">AED - UAE Dirham</option>
            <option value="SGD">SGD - Singapore Dollar</option>
            <option value="CHF">CHF - Swiss Franc</option>
        </select>

        <button type="button" class="action-button" id="currency-swap">
            ⇅ Swap Currencies
        </button>

        <label for="currency-to">To currency</label>
        <select id="currency-to">
            <option value="USD">USD - US Dollar</option>
            <option value="INR">INR - Indian Rupee</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="AED">AED - UAE Dirham</option>
            <option value="SGD">SGD - Singapore Dollar</option>
            <option value="CHF">CHF - Swiss Franc</option>
        </select>

        <button type="button" class="action-button" id="currency-convert">
            Convert Currency
        </button>

        <div id="currency-output" aria-live="polite"
            style="margin-top:20px; overflow-wrap:anywhere;">
        </div>

        <p style="font-size:12px;">
            Rates are indicative reference rates, not bank or money-exchange quotes.
        </p>
        <p style="font-size:12px;">
            Exchange-rate data: <a href="https://frankfurter.dev/"
            target="_blank" rel="noopener noreferrer">Frankfurter API</a>
        </p>
    `);

    const amountInput = document.getElementById("currency-amount");
    const fromSelect = document.getElementById("currency-from");
    const toSelect = document.getElementById("currency-to");
    const output = document.getElementById("currency-output");
    const convertButton = document.getElementById("currency-convert");

    let requestNumber = 0;

    async function convertCurrency() {
        const amountText = amountInput.value.trim();
        const from = fromSelect.value;
        const to = toSelect.value;
        const thisRequest = ++requestNumber;

        if (amountText === "" || !Number.isFinite(Number(amountText))
            || Number(amountText) < 0) {
            output.textContent = "Enter a valid amount (zero or greater).";
            return;
        }

        const amount = Number(amountText);
        convertButton.disabled = true;
        output.textContent = "Fetching latest available exchange rate...";

        try {
            let rate = 1;
            let rateDate = "Same currency";

            if (from !== to) {
                const url =
                    `https://api.frankfurter.dev/v2/rate/${from}/${to}`;

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error("Exchange-rate service is unavailable.");
                }

                const data = await response.json();

                if (!Number.isFinite(data.rate) || data.rate <= 0) {
                    throw new Error("A valid rate was not returned.");
                }

                rate = data.rate;
                rateDate = data.date || "Date unavailable";
            }

            if (thisRequest !== requestNumber) return;

            const converted = amount * rate;
            const formattedAmount = new Intl.NumberFormat("en-IN", {
                maximumFractionDigits: 2
            }).format(amount);

            const formattedResult = new Intl.NumberFormat("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4
            }).format(converted);

            output.replaceChildren();

            const heading = document.createElement("h3");
            heading.textContent = `${formattedAmount} ${from} = ${formattedResult} ${to}`;

            const rateInfo = document.createElement("p");
            rateInfo.textContent =
                `1 ${from} = ${rate.toPrecision(7)} ${to}`;

            const dateInfo = document.createElement("p");
            dateInfo.textContent = `Rate date: ${rateDate}`;

            output.append(heading, rateInfo, dateInfo);
        } catch (error) {
            if (thisRequest !== requestNumber) return;
            output.textContent =
                "Could not fetch the rate. Check your internet and try again.";
        } finally {
            if (thisRequest === requestNumber) {
                convertButton.disabled = false;
            }
        }
    }

    convertButton.addEventListener("click", convertCurrency);

    document.getElementById("currency-swap").addEventListener("click", () => {
        const oldFrom = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = oldFrom;
        convertCurrency();
    });

    convertCurrency();
}


        if (tool === "age") {
            showTool("🎂 Age Calculator", `
                <label for="birthdate">Enter your date of birth:</label>
                <input id="birthdate" type="date">
                <button class="action-button" id="calculate-age">
                    Calculate Age
                </button>
            `);

            document.getElementById("calculate-age").onclick = () => {
                const value = document.getElementById("birthdate").value;

                if (!value) {
                    result.textContent = "Please select your birth date.";
                    return;
                }

                const birth = new Date(value + "T00:00:00");
                const today = new Date();

                if (birth > today) {
                    result.textContent = "Birth date cannot be in the future.";
                    return;
                }

                let years = today.getFullYear() - birth.getFullYear();
                let months = today.getMonth() - birth.getMonth();
                let days = today.getDate() - birth.getDate();

                if (days < 0) {
                    months--;
                    const previousMonthDays = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        0
                    ).getDate();
                    days += previousMonthDays;
                }

                if (months < 0) {
                    years--;
                    months += 12;
                }

                result.textContent =
                    `Your age is ${years} years, ${months} months, and ${days} days.`;
            };
        }

        if (tool === "percentage") {
            showTool("📊 Percentage Calculator", `
                <input id="marks" type="number" min="0" step="any"
                       placeholder="Marks obtained">
                <input id="total" type="number" min="0" step="any"
                       placeholder="Total marks">
                <button class="action-button" id="calculate-percentage">
                    Calculate Percentage
                </button>
                
                
        
            `);

            document.getElementById("calculate-percentage").onclick = () => {
                const marksValue = document.getElementById("marks").value;
                const totalValue = document.getElementById("total").value;

                if (marksValue.trim() === "" || totalValue.trim() === "") {
                    result.textContent = "Please enter both values.";
                    return;
                }

                const marks = Number(marksValue);
                const total = Number(totalValue);

                if (
                    !Number.isFinite(marks) ||
                    !Number.isFinite(total) ||
                    total <= 0 ||
                    marks < 0 ||
                    marks > total
                ) {
                    result.textContent =
                        "Enter valid marks. Obtained marks must be between 0 and total marks.";
                    return;
                }

                const percentage = (marks / total) * 100;
                result.textContent =
                    "Percentage: " + percentage.toFixed(2) + "%";
            };
        }
        if (tool === "emi") {
    showTool("💰 EMI Calculator", `
        <label for="loan">Loan Amount (₹)</label>
        <input id="loan" type="number" min="1" step="any"
               placeholder="e.g. 500000">

        <label for="rate">Annual Interest Rate (%)</label>
        <input id="rate" type="number" min="0" step="any"
               placeholder="e.g. 8.5">

        <label for="tenure">Loan Duration (Years)</label>
        <input id="tenure" type="number" min="1" max="100"
               step="1" placeholder="e.g. 5">

        <button class="action-button" id="calculate-emi">
            Calculate EMI
        </button>
   
    `);

    document.getElementById("calculate-emi").onclick = () => {
        const loanText = document.getElementById("loan").value;
        const rateText = document.getElementById("rate").value;
        const tenureText = document.getElementById("tenure").value;

        if (!loanText || !rateText || !tenureText) {
            result.textContent = "Please fill in all fields.";
            return;
        }

        const principal = Number(loanText);
        const annualRate = Number(rateText);
        const years = Number(tenureText);

        if (
            !Number.isFinite(principal) ||
            !Number.isFinite(annualRate) ||
            !Number.isFinite(years) ||
            principal <= 0 ||
            annualRate < 0 ||
            years <= 0 ||
            !Number.isInteger(years) ||
            years > 100
        ) {
            result.textContent = "Please enter valid values.";
            return;
        }

        const months = years * 12;
        const monthlyRate = annualRate / 1200;

        const emi = monthlyRate === 0
            ? principal / months
            : principal * monthlyRate *
              Math.pow(1 + monthlyRate, months) /
              (Math.pow(1 + monthlyRate, months) - 1);

        const totalPayment = emi * months;
        const totalInterest = totalPayment - principal;

        result.textContent =
            `Monthly EMI: ₹${emi.toLocaleString("en-IN", {
                maximumFractionDigits: 2
            })} | Total Interest: ₹${totalInterest.toLocaleString("en-IN", {
                maximumFractionDigits: 2
            })} | Total Payment: ₹${totalPayment.toLocaleString("en-IN", {
                maximumFractionDigits: 2
            })}`;
    };
}if (tool === "qr") {
    showTool("📱 QR Code Generator", `
        <label for="qr-text">Enter text or website URL</label>
        <input id="qr-text" type="text"
               placeholder="https://example.com">

        <button class="action-button" id="generate-qr">
            Generate QR Code
        </button>

        <div id="qr-output" style="margin-top:20px;"></div>
    `);

    document.getElementById("generate-qr").onclick = () => {
        const text = document.getElementById("qr-text").value.trim();
        const output = document.getElementById("qr-output");

        output.replaceChildren();

        if (!text) {
            result.textContent = "Please enter some text or a URL.";
            return;
        }

        result.textContent = "Generating QR code...";

        const qrImage = document.createElement("img");
        qrImage.alt = "Generated QR code";
        qrImage.width = 220;
        qrImage.height = 220;
        qrImage.style.maxWidth = "100%";
        qrImage.referrerPolicy = "no-referrer";

        qrImage.onload = () => {
            result.textContent = "QR code generated successfully.";
            output.appendChild(qrImage);

const downloadButton = document.createElement("button");
downloadButton.textContent = "⬇️ Download QR Code";
downloadButton.className = "action-button";

downloadButton.onclick = async () => {
    try {
        downloadButton.disabled = true;
        downloadButton.textContent = "Downloading...";

        const response = await fetch(qrImage.src);

        if (!response.ok) {
            throw new Error("QR download failed");
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = "smarttools-qr.png";

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        downloadButton.textContent = "⬇️ Download QR Code";
    } catch (error) {
        result.textContent =
            "Direct download blocked. Please try again or use the QR image's Save Image option.";
        downloadButton.textContent = "⬇️ Download QR Code";
    } finally {
        downloadButton.disabled = false;
    }
};

output.appendChild(downloadButton);
        };

        qrImage.onerror = () => {
            result.textContent =
                "QR code generate nahi hua. Internet connection check karo.";
        };

        qrImage.src =
            "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
            encodeURIComponent(text);
    };
}

if (tool === "compressor") {
    showTool("🖼️ Image Compressor", `
        <label for="image-file">Select an image</label>
        <input id="image-file" type="file" accept="image/jpeg,image/png,image/webp">

        <label for="quality">Image quality: <span id="quality-value">70%</span></label>
        <input id="quality" type="range" min="10" max="100" value="70">

        <label for="image-width">Output width (pixels)</label>
        <input id="image-width" type="number" min="1" max="6000"
               placeholder="e.g. 1200">

        <button class="action-button" id="compress-image">
            Compress Image
        </button>

        <div id="compress-output" style="margin-top:20px;"></div>
    `);

    const fileInput = document.getElementById("image-file");
    const qualityInput = document.getElementById("quality");
    const qualityValue = document.getElementById("quality-value");
    const widthInput = document.getElementById("image-width");
    const output = document.getElementById("compress-output");
    const compressButton = document.getElementById("compress-image");

    qualityInput.addEventListener("input", () => {
        qualityValue.textContent = qualityInput.value + "%";
    });

    compressButton.onclick = async () => {
        output.replaceChildren();
        result.textContent = "";

        const file = fileInput.files[0];

        if (!file) {
            result.textContent = "Please select an image first.";
            return;
        }

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            result.textContent = "Please select a JPG, PNG or WebP image.";
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            result.textContent = "Please choose an image smaller than 20 MB.";
            return;
        }

        const requestedWidth = widthInput.value.trim();
        const maxWidth = requestedWidth ? Number(requestedWidth) : 1200;

        if (
            !Number.isInteger(maxWidth) ||
            maxWidth < 1 ||
            maxWidth > 6000
        ) {
            result.textContent = "Width must be a whole number from 1 to 6000.";
            return;
        }

        compressButton.disabled = true;
        compressButton.textContent = "Compressing...";

        try {
            const image = new Image();
            const objectUrl = URL.createObjectURL(file);

            try {
                await new Promise((resolve, reject) => {
                    image.onload = resolve;
                    image.onerror = () => reject(new Error("Image could not be opened."));
                    image.src = objectUrl;
                });

                const scale = Math.min(1, maxWidth / image.naturalWidth);
                const canvas = document.createElement("canvas");

                canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
                canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

                const context = canvas.getContext("2d");

                if (!context) {
                    throw new Error("Canvas is not supported.");
                }

                context.drawImage(image, 0, 0, canvas.width, canvas.height);

                const blob = await new Promise(resolve => {
                    canvas.toBlob(resolve, "image/jpeg", Number(qualityInput.value) / 100);
                });

                if (!blob) {
                    throw new Error("Image compression failed.");
                }

                const downloadUrl = URL.createObjectURL(blob);
                const preview = document.createElement("img");

                preview.src = downloadUrl;
                preview.alt = "Compressed image preview";
                preview.style.display = "block";
                preview.style.maxWidth = "100%";
                preview.style.height = "auto";
                preview.style.marginBottom = "12px";

                const details = document.createElement("p");
                const formatSize = bytes => (bytes / 1024).toFixed(1) + " KB";
                const saved = (1 - blob.size / file.size) * 100;

                details.textContent =
                    `Original: ${formatSize(file.size)} | Compressed: ${formatSize(blob.size)} | ` +
                    (saved > 0
                        ? `${saved.toFixed(1)}% smaller`
                        : "The output is not smaller than the original.");

                const link = document.createElement("a");
                link.href = downloadUrl;
                link.download = "smarttools-compressed.jpg";
                link.className = "action-button";
                link.style.display = "inline-block";
                link.style.textDecoration = "none";
                link.textContent = "⬇️ Download Compressed Image";

                output.append(preview, details, link);
                result.textContent = "Image processing complete.";
            } finally {
                URL.revokeObjectURL(objectUrl);
            }
        } catch (error) {
            result.textContent = error.message || "Could not compress this image.";
        } finally {
            compressButton.disabled = false;
            compressButton.textContent = "Compress Image";
        }
    };
}

    });
});

document.getElementById("search").addEventListener("input", event => {
    const query = event.target.value.toLowerCase().trim();

    document.querySelectorAll(".tool-card").forEach(card => {
        card.hidden = !card.textContent.toLowerCase().includes(query);
        
    });
});
const themeToggle = document.getElementById("theme-toggle");

// Previously selected theme load karo
if (localStorage.getItem("smarttools-theme") === "dark") {
    document.body.classList.add("dark-mode");
}

function updateThemeButton() {
    themeToggle.textContent = document.body.classList.contains("dark-mode")
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";
}

updateThemeButton();

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    localStorage.setItem(
        "smarttools-theme",
        isDark ? "dark" : "light"
    );

    updateThemeButton();
});