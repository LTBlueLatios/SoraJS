// This is a utility file that contains functions for utility math operations

/**
 * Guidelines
 * - Use this file to only store utility functions that perform math operations
 * - To determine if a function belongs here, ask yourself if the function is specific to math operations
 * - If the function is specific but general enough to be used in multiple components, it belongs here
 * - If the function is project-specific, it does not belong here
 */

/**
 * ==============================
 * BASIC NUMBER OPERATIONS
 * ==============================
 */

/**
 * Rounds a number to a specified number of decimal places
 * @param {number} value - The number to round
 * @param {number} [decimals=0] - The number of decimal places
 * @returns {number} - The rounded number
 */
function round(value, decimals = 0) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Constrains a number between a minimum and maximum value
 * @param {number} value - The value to constrain
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} - The constrained value
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Performs linear interpolation between two values
 * @param {number} start - The start value
 * @param {number} end - The end value
 * @param {number} t - The interpolation factor (0-1)
 * @returns {number} - The interpolated value
 */
function lerp(start, end, t) {
    return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Maps a value from one range to another
 * @param {number} value - The value to map
 * @param {number} inMin - The minimum of the input range
 * @param {number} inMax - The maximum of the input range
 * @param {number} outMin - The minimum of the output range
 * @param {number} outMax - The maximum of the output range
 * @returns {number} - The mapped value
 */
function mapRange(value, inMin, inMax, outMin, outMax) {
    return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

/**
 * Generates a random number between min and max
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @param {boolean} [integer=false] - Whether to return an integer
 * @returns {number} - A random number within the specified range
 */
function randomBetween(min, max, integer = false) {
    const value = min + Math.random() * (max - min);
    return integer ? Math.floor(value) : value;
}

/**
 * ==============================
 * SIMPLE STATISTICAL FUNCTIONS
 * ==============================
 */

/**
 * Calculates the sum of an array of numbers
 * @param {Array<number>} data - Array of numeric values
 * @returns {number} - The sum
 */
function sum(data) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Data must be a non-empty array.");
    }

    let total = 0;
    for (let i = 0; i < data.length; i++) {
        total += Number(data[i]);
    }

    return total;
}

/**
 * Calculates the product of an array of numbers
 * @param {Array<number>} data - Array of numeric values
 * @returns {number} - The product
 */
function product(data) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Data must be a non-empty array.");
    }

    let result = 1;
    for (let i = 0; i < data.length; i++) {
        result *= Number(data[i]);
    }

    return result;
}

/**
 * Calculates the average (mean) of an array of numbers
 * @param {Array<number>} data - Array of numeric values
 * @returns {number} - The average
 */
function average(data) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Data must be a non-empty array.");
    }

    return sum(data) / data.length;
}

/**
 * Calculates the weighted average of an array of numbers
 * @param {Array<number>} values - Array of numeric values
 * @param {Array<number>} weights - Array of weights
 * @returns {number} - The weighted average
 */
function weightedAverage(values, weights) {
    if (!Array.isArray(values) || !Array.isArray(weights)) {
        throw new Error("Both values and weights must be arrays.");
    }

    if (values.length !== weights.length) {
        throw new Error("Values and weights arrays must have the same length.");
    }

    if (values.length === 0) {
        throw new Error("Arrays must not be empty.");
    }

    let weightSum = 0;
    let valueSum = 0;

    for (let i = 0; i < values.length; i++) {
        weightSum += Number(weights[i]);
        valueSum += Number(values[i]) * Number(weights[i]);
    }

    if (weightSum === 0) {
        throw new Error("Sum of weights cannot be zero.");
    }

    return valueSum / weightSum;
}

/**
 * Finds the minimum and maximum values in a single pass
 * @param {Array<number>} data - Array of numeric values
 * @returns {{min: number, max: number}} - Object containing min and max values
 */
function minMax(data) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Data must be a non-empty array.");
    }

    let min = Number(data[0]);
    let max = min;

    for (let i = 1; i < data.length; i++) {
        const value = Number(data[i]);
        if (value < min) min = value;
        if (value > max) max = value;
    }

    return {
        min,
        max
    };
}

/**
 * ==============================
 * ROUNDING AND APPROXIMATION
 * ==============================
 */

/**
 * Rounds a number to the nearest multiple
 *
 * @export
 * @param {number} value - The number to round
 * @param {number} [decimals=0] - The number of decimal places
 * @return {number} - The rounded number
 */
function truncate(value, decimals = 0) {
    const factor = Math.pow(10, decimals);
    return Math.trunc(value * factor) / factor;
}

/**
 * ==============================
 * DISTRIBUTION ANALYSIS FUNCTIONS
 * ==============================
 */

/**
 * Calculates the skewness of a distribution
 * @param {Array<number>} data - Array of numeric values
 * @returns {number} - The skewness value
 */
function getSkewness(data) {
    if (!Array.isArray(data) || data.length < 3) {
        throw new Error("Data must be an array with at least 3 elements.");
    }

    const n = data.length;
    const mean = average(data);
    const variance = getVariance(data, false);

    if (variance === 0) return 0;

    const stdDev = Math.sqrt(variance);
    let sum = 0;

    for (let i = 0; i < n; i++) {
        const value = Number(data[i]);
        const deviation = (value - mean) / stdDev;
        sum += Math.pow(deviation, 3);
    }

    return n * sum / ((n - 1) * (n - 2));
}

/**
 * Calculates the kurtosis of a distribution
 * @param {Array<number>} data - Array of numeric values
 * @returns {number} - The kurtosis value
 */
function getKurtosis(data) {
    if (!Array.isArray(data) || data.length < 4) {
        throw new Error("Data must be an array with at least 4 elements.");
    }

    const n = data.length;
    const mean = average(data);
    const variance = getVariance(data, false);

    if (variance === 0) return 0;

    const stdDev = Math.sqrt(variance);
    let sum = 0;

    for (let i = 0; i < n; i++) {
        const value = Number(data[i]);
        const deviation = (value - mean) / stdDev;
        sum += Math.pow(deviation, 4);
    }

    const a = n * (n + 1) * sum;
    const b = (n - 1) * (n - 2) * (n - 3);
    const c = 3 * Math.pow(n - 1, 2);

    return (a / b) - (c / ((n - 2) * (n - 3)));
}

/**
 * Calculates the percentile of a data set
 * @param {Array<number>} data - Array of numeric values
 * @param {number} percentile - The percentile to calculate (0-100)
 * @returns {number} - The percentile value
 */
function getPercentile(data, percentile) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Data must be a non-empty array.");
    }

    if (percentile < 0 || percentile > 100) {
        throw new Error("Percentile must be between 0 and 100.");
    }

    const sortedData = [...data].sort((a, b) => Number(a) - Number(b));
    const index = (percentile / 100) * (sortedData.length - 1);

    if (Number.isInteger(index)) {
        return Number(sortedData[index]);
    } else {
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;

        return (1 - weight) * Number(sortedData[lower]) + weight * Number(sortedData[upper]);
    }
}

/**
 * Calculates the interquartile range (IQR) of a data set
 * @param {Array<number>} data - Array of numeric values
 * @returns {number} - The IQR value
 */
function getIQR(data) {
    return getPercentile(data, 75) - getPercentile(data, 25);
}

/**
 * Calculates a Z-score for a value in a distribution
 * @param {number} value - The value to convert to Z-score
 * @param {number} mean - The mean of the distribution
 * @param {number} stdDev - The standard deviation of the distribution
 * @returns {number} - The Z-score
 */
function getZScore(value, mean, stdDev) {
    if (stdDev === 0) {
        throw new Error("Standard deviation cannot be zero.");
    }

    return (value - mean) / stdDev;
}

/**
 * Creates a frequency distribution from a data set
 * @param {Array<number>} data - Array of numeric values
 * @param {number} [bins=0] - Number of bins (0 for auto-detection)
 * @returns {Array<{bin: number, count: number, frequency: number}>} - Frequency distribution
 */
function getFrequencyDistribution(data, bins = 0) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Data must be a non-empty array.");
    }

    const { min, max } = minMax(data);

    // Auto-calculate bins using Sturges' formula if not specified
    if (bins <= 0) {
        bins = Math.ceil(Math.log2(data.length)) + 1;
    }

    const binWidth = (max - min) / bins;
    const distribution = new Array(bins).fill(0).map((_, i) => ({
        bin: min + i * binWidth + binWidth / 2,
        count: 0,
        frequency: 0
    }));

    // Count values in each bin
    for (let i = 0; i < data.length; i++) {
        const value = Number(data[i]);
        // Handle edge case for the maximum value
        const binIndex = value === max
            ? bins - 1
            : Math.floor((value - min) / binWidth);
        distribution[binIndex].count++;
    }

    // Calculate frequencies
    for (let i = 0; i < bins; i++) {
        distribution[i].frequency = distribution[i].count / data.length;
    }

    return distribution;
}

/**
 * Checks if a value is within a specified range
 *
 * @param {number} value - The value to check
 * @param {number} min - The minimum value of the range
 * @param {number} max - The maximum value of the range
 * @return {boolean} - True if the value is within the range, false otherwise
 */
function isWithinRange(value, min, max) {
    return value >= min && value <= max;
}

/**
 * Calculates the Shannon entropy of a data series
 * @param {Array<number>} data - Array of numeric values
 * @returns {number} - The entropy value
 */
function getEntropy(data) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Data series must not be empty.");
    }

    const frequencyMap = new Map();
    const total = data.length;

    for (let i = 0; i < total; i++) {
        const value = typeof data[i] === "number" ? data[i] : Number(data[i]);
        frequencyMap.set(value, (frequencyMap.get(value) || 0) + 1);
    }

    let entropy = 0;
    for (const count of frequencyMap.values()) {
        const probability = count / total;
        entropy -= probability * Math.log2(probability);
    }

    return entropy;
}

/**
 * Calculates the arithmetic mean of a data series
 * @param {Array<number>} data - Array of numeric values
 * @returns {number} - The mean value
 */
function getMean(data) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Data series must not be empty.");
    }

    let sum = 0;
    const length = data.length;

    for (let i = 0; i < length; i++) {
        sum += typeof data[i] === "number" ? data[i] : Number(data[i]);
    }

    return sum / length;
}

/**
 * Calculates the variance of a data series
 * @param {Array<number>} data - Array of numeric values
 * @param {boolean} [isSample=true] - Whether to calculate sample variance (n-1) or population variance (n)
 * @returns {number} - The variance value
 */
function getVariance(data, isSample = true) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Data series must not be empty.");
    }

    if (data.length === 1) {
        return 0;
    }

    const mean = getMean(data);
    let sumSquaredDifferences = 0;
    const length = data.length;

    for (let i = 0; i < length; i++) {
        const value = typeof data[i] === "number" ? data[i] : Number(data[i]);
        const difference = value - mean;
        sumSquaredDifferences += difference * difference;
    }

    return sumSquaredDifferences / (length - (isSample ? 1 : 0));
}

/**
 * Calculates the standard deviation of a data series
 * @param {Array<number>} data - Array of numeric values
 * @param {boolean} [isSample=true] - Whether to calculate sample standard deviation or population standard deviation
 * @returns {number} - The standard deviation value
 */
function getStandardDeviation(data, isSample = true) {
    return Math.sqrt(getVariance(data, isSample));
}

/**
 * Calculates the median of a data series
 * @param {Array<number>} data - Array of numeric values
 * @returns {number} - The median value
 */
function getMedian(data) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Data series must not be empty.");
    }

    const sortedData = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sortedData.length / 2);

    return sortedData.length % 2 === 0
        ? (sortedData[mid - 1] + sortedData[mid]) / 2
        : sortedData[mid];
}

/**
 * Calculates the covariance between two data series
 * @param {Array<number>} dataX - First array of numeric values
 * @param {Array<number>} dataY - Second array of numeric values
 * @param {boolean} [isSample=true] - Whether to calculate sample covariance or population covariance
 * @returns {number} - The covariance value
 */
function getCovariance(dataX, dataY, isSample = true) {
    if (!Array.isArray(dataX) || !Array.isArray(dataY)) {
        throw new Error("Both data series must be arrays.");
    }

    if (dataX.length !== dataY.length) {
        throw new Error("Data series must have the same length.");
    }

    if (dataX.length === 0) {
        throw new Error("Data series must not be empty.");
    }

    const meanX = getMean(dataX);
    const meanY = getMean(dataY);
    let covariance = 0;
    const length = dataX.length;

    for (let i = 0; i < length; i++) {
        const valueX = typeof dataX[i] === "number" ? dataX[i] : Number(dataX[i]);
        const valueY = typeof dataY[i] === "number" ? dataY[i] : Number(dataY[i]);
        covariance += (valueX - meanX) * (valueY - meanY);
    }

    return covariance / (length - (isSample ? 1 : 0));
}

/**
 * Calculates the Pearson correlation coefficient between two data series
 * @param {Array<number>} dataX - First array of numeric values
 * @param {Array<number>} dataY - Second array of numeric values
 * @returns {number} - The correlation coefficient (-1 to 1)
 */
function getPearsonCorrelation(dataX, dataY) {
    const sdX = getStandardDeviation(dataX);
    const sdY = getStandardDeviation(dataY);

    if (sdX === 0 || sdY === 0) {
        return 0;
    }

    return getCovariance(dataX, dataY) / (sdX * sdY);
}

export {
    round,
    truncate,
    clamp,
    lerp,
    mapRange,
    randomBetween,
    sum,
    product,
    average,
    weightedAverage,
    minMax,
    getSkewness,
    getKurtosis,
    getPercentile,
    getIQR,
    getZScore,
    getFrequencyDistribution,
    getEntropy,
    getMean,
    getVariance,
    getStandardDeviation,
    getMedian,
    getCovariance,
    getPearsonCorrelation,
    isWithinRange
}