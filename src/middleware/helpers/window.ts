function getCurrentWindowStart(): number {
    const now = new Date();
    return Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    );
}

export {
    getCurrentWindowStart
}