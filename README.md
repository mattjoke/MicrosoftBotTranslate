# MicrosoftBotTranslate
This MicrosoftBot based on Azure Cognitive services is able to communicate in any language.
Every input is passed trough Bing Translator and sent to LUIS (in English language). Luis tries to identify intent of input and based on returned input it tries to question QnA Service. Output form QnA Service is then passed trough Bing Translator again to match inputed language.
