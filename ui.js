const minInput = 0;
const maxInput = 2000;

const waveTypeName = '波动型';
const fallingTypeName = '连续下跌型';
const thirdPeriodTypeName = '3期型';
const fourthPeriodTypeName = '4期型';

const selectableDays = [
    Days.MON1, Days.MON2,
    Days.TUE1, Days.TUE2,
    Days.WED1, Days.WED2,
    Days.THU1, Days.THU2,
    Days.FRI1, Days.FRI2,
    Days.SAT1, Days.SAT2,
];

function onBodyLoad() {
    buildPriceInputTable();
    buildParameterInputTable()

    writePricesToInput(loadPrices())
    writePresetParametersToInput(acnlPreset);
}

function onInlinePredictionButtonClick() {
    const prices = readPricesFromInlineInput();
    if (!prices) {
        return;
    }

    writePricesToInput(prices);
    onPredictionButtonClick();
}

function onPredictionButtonClick() {
    const prices = readPricesFromInput();
    savePrices(prices);
    writePricesToInlineInput(prices);

    const result = predict(readParametersFromInput(), prices);
    displayResult(prices, result);
}

function onParameterInputToggleButtonClick() {
    parameterInputSection = document.getElementById('parameterInput');
    if (parameterInputSection.style.display == 'block') {
        parameterInputSection.style.display = 'none';
    } else {
        parameterInputSection.style.display = 'block';
    }
}

function onParameterPresetChange() {
    writePresetParametersToInput(getPreset(parameterPreset.value));
}

function loadPrices() {
    if (!localStorage.prices) {
        return null;
    }

    return localStorage.prices.split(',')
            .map(e => parseInt(e));
}

function savePrices(prices) {
    localStorage.prices = prices;
}

function readPricesFromInlineInput() {
    let inlineInput = priceInputForm.inlineInput.value;
    inlineInput = inlineInput.replace(/^[^0-9]+|[^0-9]+$/g, '');
    inlineInput = inlineInput.replace(/[^0-9/]+|[\/]/g, ' ');

    if (inlineInput == '') {
        return null;
    }
    return inlineInput.split(' ');
}

function writePricesToInlineInput(prices) {
    if (!prices) {
        return;
    }

    let inlinePrices = (prices[0] ? prices[0] : '0') + ' ';

    for (let i = 1; i < prices.length; i++) {
        if (i % 2 == 0) {
            inlinePrices += '/';
        }
        if (prices[i]) {
            inlinePrices += prices[i];
        }
        if (i % 2 == 0) {
            inlinePrices += ' ';
        }
    }
    inlinePrices = inlinePrices.replace(/[^0-9]+$/g, '');

    priceInputForm.inlineInput.value = inlinePrices;
}

function readPricesFromInput() {
    return Array.from(document.getElementsByName('price')).map(e => {
        let intValue = parseInt(e.value);
        return isBetween(intValue, minInput, maxInput) ? intValue : null;
    });
}

function writePricesToInput(prices) {
    if (!prices) {
        return;
    }

    document.getElementsByName('price').forEach(e => e.value = '');

    const priceInputs = document.getElementsByName('price');
    for (i = 0; i < priceInputs.length && i < prices.length; i++) {
        if (isBetween(prices[i], minInput, maxInput)) {
            priceInputs[i].value = prices[i];
        }
    }
}

function readParametersFromInput() {
    function readTransitionFromInput(inputIndex) {
        return new Transition(
            parseIntWithDefault(parameterInputForm.transitionMethod[inputIndex].value, -1),
            parseIntWithDefault(parameterInputForm.transitionMin[inputIndex].value, 0),
            parseIntWithDefault(parameterInputForm.transitionMax[inputIndex].value, 0),
        );
    };

    function readSelectedDaysFromInput(inputGroupIndex) {
        const offset = inputGroupIndex * selectableDays.length;
        const selectedDays = new Array();
        for (let i = 0; i < selectableDays.length; i++) {
            if (parameterInputForm.transitionDay[offset + i].checked) {
                selectedDays.push(selectableDays[i]);
            }
        }
        return selectedDays;
    }

    return {
        tolerance: parseIntWithDefault(parameterInputForm.tolerance.value, 0),
        wave: {
            risingTransition:             readTransitionFromInput(0),
            twoTimesFalling1Transition:   readTransitionFromInput(1),
            twoTimesFalling2Transition:   readTransitionFromInput(2),
            threeTimesFalling1Transition: readTransitionFromInput(3),
            threeTimesFalling2Transition: readTransitionFromInput(4),
            threeTimesFalling3Transition: readTransitionFromInput(5),
            twoTimesFallingStartDays:     readSelectedDaysFromInput(0),
            threeTimesFallingStartDays:   readSelectedDaysFromInput(1),
        },
        falling: {
            mon1Transition:      readTransitionFromInput(6),
            otherDaysTransition: readTransitionFromInput(7),
        },
        thirdPeriod: {
            mon1Transition:         readTransitionFromInput(8),
            beforeRisingTransition: readTransitionFromInput(9),
            rising1Transition:      readTransitionFromInput(10),
            rising2Transition:      readTransitionFromInput(11),
            rising3Transition:      readTransitionFromInput(12),
            rising4Transition:      readTransitionFromInput(13),
            rising5Transition:      readTransitionFromInput(14),
            rising6Transition:      readTransitionFromInput(15),
            afterRisingTransition:  readTransitionFromInput(16),
            risingStartDays:        readSelectedDaysFromInput(2),
        },
        fourthPeriod: {
            mon1Transition:         readTransitionFromInput(17),
            beforeRisingTransition: readTransitionFromInput(18),
            rising1Transition:      readTransitionFromInput(19),
            rising2Transition:      readTransitionFromInput(20),
            rising3Transition:      readTransitionFromInput(21),
            rising4Transition:      readTransitionFromInput(22),
            rising5Transition:      readTransitionFromInput(23),
            rising6Transition:      readTransitionFromInput(24),
            afterRisingTransition:  readTransitionFromInput(25),
            risingStartDays:        readSelectedDaysFromInput(3),
            hasFourthPeriodPeak:    parameterInputForm.fourthPeriodPeak.checked,
        },
    };
}

function writePresetParametersToInput(preset) {
    parameterInputForm.parameterPreset.value = preset.key;

    function writeTransitionToInput(inputIndex, transition) {
        parameterInputForm.transitionMethod[inputIndex].value = transition.method;
        parameterInputForm.transitionMin[inputIndex].value = transition.min;
        parameterInputForm.transitionMax[inputIndex].value = transition.max;
    };

    function writeSelectedDaysToInput(inputGroupIndex, days) {
        function dayToOrder(day) {
            return day - selectableDays[0];
        };
        const offset = inputGroupIndex * selectableDays.length;

        for (let i = 0; i < selectableDays.length; i++) {
            parameterInputForm.transitionDay[offset + i].checked = false;
        }
        for (let day of days) {
            parameterInputForm.transitionDay[offset + dayToOrder(day)].checked = true;
        }
    }

    const transitionOrder = [
        preset.wave.risingTransition,
        preset.wave.twoTimesFalling1Transition,
        preset.wave.twoTimesFalling2Transition,
        preset.wave.threeTimesFalling1Transition,
        preset.wave.threeTimesFalling2Transition,
        preset.wave.threeTimesFalling3Transition,
        preset.falling.mon1Transition,
        preset.falling.otherDaysTransition,
        preset.thirdPeriod.mon1Transition,
        preset.thirdPeriod.beforeRisingTransition,
        preset.thirdPeriod.rising1Transition,
        preset.thirdPeriod.rising2Transition,
        preset.thirdPeriod.rising3Transition,
        preset.thirdPeriod.rising4Transition,
        preset.thirdPeriod.rising5Transition,
        preset.thirdPeriod.rising6Transition,
        preset.thirdPeriod.afterRisingTransition,
        preset.fourthPeriod.mon1Transition,
        preset.fourthPeriod.beforeRisingTransition,
        preset.fourthPeriod.rising1Transition,
        preset.fourthPeriod.rising2Transition,
        preset.fourthPeriod.rising3Transition,
        preset.fourthPeriod.rising4Transition,
        preset.fourthPeriod.rising5Transition,
        preset.fourthPeriod.rising6Transition,
        preset.fourthPeriod.afterRisingTransition,
    ];
    for (let i = 0; i < transitionOrder.length; i++) {
        writeTransitionToInput(i, transitionOrder[i]);
    }

    const selectedDaysOrder = [
        preset.wave.twoTimesFallingStartDays,
        preset.wave.threeTimesFallingStartDays,
        preset.thirdPeriod.risingStartDays,
        preset.fourthPeriod.risingStartDays,
    ];
    for (let i = 0; i < selectedDaysOrder.length; i++) {
        writeSelectedDaysToInput(i, selectedDaysOrder[i]);
    }

    parameterInputForm.fourthPeriodPeak.checked = preset.fourthPeriod.hasFourthPeriodPeak;
}

function buildPriceInputTable() {
    const tableBody = document.getElementById('priceInputTableBody');
    const priceInputHtml = '<input type="number" name="price" class="price" '
            + 'min="' + minInput + '" max="' + maxInput + '">';

    for (let day of ["周一", "周二", "周三", "周四", "周五", "周六"]) {
        let insertedRow = tableBody.insertRow(-1);

        let headerCell = document.createElement('th');
        headerCell.innerText = day;
        insertedRow.appendChild(headerCell)

        let inputCell = insertedRow.insertCell(-1);
        inputCell.innerHTML = priceInputHtml + '/' + priceInputHtml;
    }
}

function buildParameterInputTable() {
    buildTransitionMethodInputs();
    buildTransitionAmountInputs();
    buildTransitionDaysInputs()
}

function buildTransitionMethodInputs() {
    const transitionMethods = [
        {
            name: '价格（铃钱）',
            value: Method.PRICE,
        },
        {
            name: '本次价格 - 上次价格（铃钱）',
            value: Method.PREV_PRICE_DIFF,
        },
        {
            name: '本次价格 / 上次价格（%）',
            value: Method.PREV_PRICE_RATIO,
        },
        {
            name: '本次变化幅度 - 上次变化幅度（%）',
            value: Method.PREV_PRICE_RATIO_DIFF,
        },
        {
            name: '本次价格 / 买入价格 (%)',
            value: Method.PURCHASE_PRICE_RATIO,
        },
    ];

    for (cell of document.getElementsByClassName('transitionMethodCell')) {
        const transitionMethodSelect = document.createElement('select');
        transitionMethodSelect.name = 'transitionMethod';
        cell.appendChild(transitionMethodSelect);

        for (let i = 0; i < transitionMethods.length; i++) {
            const transitionMethodOption = document.createElement('option');
            transitionMethodOption.innerText = transitionMethods[i].name;
            transitionMethodOption.value = transitionMethods[i].value;
            transitionMethodSelect.appendChild(transitionMethodOption);
        }
    }
}

function buildTransitionAmountInputs() {
    const transitionAmountHtml = ''
            + '<input type="number" name="transitionMin" class="transitionAmount">'
            + '~'
            + '<input type="number" name="transitionMax" class="transitionAmount">';

    for (cell of document.getElementsByClassName('transitionAmountCell')) {
        cell.innerHTML = transitionAmountHtml;
    }
}

function buildTransitionDaysInputs() {
    const transitionDayInputHtml = '<input type="checkbox" name="transitionDay">';
    const days = [
        '周一上午', '周一下午',
        '周二上午', '周二下午',
        '周三上午', '周三下午',
        '周四上午', '周四下午',
        '周五上午', '周五下午',
        '周六上午', '周六下午',
    ];

    for (cell of document.getElementsByClassName('transitionDaysCell')) {
        for (day of days) {
            const dayLabel = document.createElement('label');
            dayLabel.innerHTML = transitionDayInputHtml + day;
            cell.appendChild(dayLabel);
        }
    }
}

function displayResult(realPrices, result) {
    displayRealPrices(realPrices);

    if (!result) {
        return;
    }

    const tableBody = document.getElementById('predictionTableBody');
    tableBody.innerHTML = '';
    displayWaveResult(waveTypeName, result.wave, tableBody);
    displayFallingResult(fallingTypeName, result.falling, tableBody);
    displayNthPeriodResult(thirdPeriodTypeName, result.thirdPeriod, tableBody);
    displayNthPeriodResult(fourthPeriodTypeName, result.fourthPeriod, tableBody);

    document.getElementById('predictionResult').style.display = 'block';
}

function displayRealPrices(prices) {
    const realPriceCells = document.getElementsByClassName('realPrice');
    for (let i = 0; i < prices.length && i < realPriceCells.length; i++) {
        realPriceCells[i].innerText = (prices[i] ? prices[i] : '-');
    }
}

function displayWaveResult(title, result, tableBody) {
    function transitionTypeToString(type) {
        switch (type) {
            case WavePatternTransitionType.RISING:
                return '↑';
            case WavePatternTransitionType.TWO_TIMES_FALLING:
            case WavePatternTransitionType.THREE_TIMES_FALLING:
                return '↓';
        }
    };

    for (let eachResult of result) {
        const key = eachResult[0];
        const value = eachResult[1];
        if (!value) {
            continue;
        }

        const detailedType = [...key]
                .reduce((acc, cur, _) => acc + transitionTypeToString(cur), '');
        displayResultRow(title, detailedType, value, tableBody);
    }
}

function displayFallingResult(title, result, tableBody) {
    if (!result) {
        return;
    }

    displayResultRow(title, null, result, tableBody);
}

function displayNthPeriodResult(title, result, tableBody) {
    const detailedTypes = [
        '周一上午上涨', '周一下午上涨',
        '周二上午上涨', '周二下午上涨',
        '周三上午上涨', '周三下午上涨',
        '周四上午上涨', '周四下午上涨',
        '周五上午上涨', '周五下午上涨',
        '周六上午上涨', '周六下午上涨',
    ];

    for (let i = 0; i < result.length; i++) {
        const eachResult = result[i];
        if (!eachResult) {
            continue;
        }

        displayResultRow(title, detailedTypes[i], eachResult, tableBody);
    }
}

function displayResultRow(typeName, detailedType, result, tableBody) {
    let insertedRow = tableBody.insertRow(-1);

    let typeNameCell = document.createElement('th');
    typeNameCell.innerText = typeName;
    insertedRow.appendChild(typeNameCell);

    if (detailedType && detailedType != '') {
        let detailedTypeCell = document.createElement('th');
        detailedTypeCell.innerText = detailedType;
        insertedRow.appendChild(detailedTypeCell);
    } else {
        typeNameCell.colSpan = 2;
    }

    let maxPrice = 0;
    let maxPriceCells;
    for (let i = 0; i < result.length; i++) {
        const priceCell = insertedRow.insertCell(-1);
        const min = Math.floor(result[i].min);
        const max = Math.ceil(result[i].max);

        priceCell.innerText = (min == max ? min : min + '~' + max);

        if (maxPrice < max) {
            maxPrice = max;
            maxPriceCells = new Array();
        }
        if (maxPrice == max) {
            maxPriceCells.push(priceCell);
        }
    }
    maxPriceCells.forEach(c => {
        c.className = 'maxPrice';
    });
}

function parseIntWithDefault(string, defaultValue) {
    let value = parseInt(string);
    return value ? value : defaultValue;
}

function isBetween(value, min, max) {
    return value && min <= value && value <= max;
}
