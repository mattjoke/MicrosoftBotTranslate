class TranslateMiddleware {
    async onTurn(context, next) {
        console.log(`Leading Edge`);
        await next();
        console.log(`Trailing Edge`);
    }
}