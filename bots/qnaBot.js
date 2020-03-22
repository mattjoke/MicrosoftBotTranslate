// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler } = require('botbuilder');
const request = require('request');
const uuidv4 = require('uuid/v4');

/**
 * A simple bot that responds to utterances with answers from QnA Maker.
 * If an answer is not found for an utterance, the bot responds with help.
 */
class QnABot extends ActivityHandler {
    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
     */
    constructor(conversationState, userState, dialog) {
        super();
        if (!conversationState) throw new Error('[QnABot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[QnABot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[QnABot]: Missing parameter. dialog is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        //Translation API variables
        this.language = "en";

        this.onMessage(async (context, next) => {
            console.log('Running dialog with Message Activity.');

           

            // Run the Dialog with the new message Activity.
            await this.dialog.run(context, this.dialogState);
    
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        // If a new user is added to the conversation, send them a greeting message
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('Welcome to the QnA Maker sample! Ask me a question and I will try to answer it.');
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        /*this.onTurn(async (context, next) => {
            console.log(`Leading Edge`);
            let text = context._activity.text;
            let done = false;
            await this.translateText(text, async (traslation) => {
                let lang = traslation.detectedLanguage.language;
                //context.sendActivity(traslation.translations[0].text);
                console.log(context);
                context._activity.text = traslation.translations[0].text;
                done = true;
            });
            while(!done){console.log(context._activity.text);}
            await next();
            console.log(`Trailing Edge`);
        });*/
    }
    translateText(text, _callback){
        var key_var = 'TRANSLATOR_TEXT_SUBSCRIPTION_KEY';
        if (!process.env[key_var]) {
            throw new Error('Please set/export the following environment variable: ' + key_var);
        }
        var subscriptionKey = process.env[key_var];
        var endpoint_var = 'TRANSLATOR_TEXT_ENDPOINT';
        if (!process.env[endpoint_var]) {
            throw new Error('Please set/export the following environment variable: ' + endpoint_var);
        }
        var endpoint = process.env[endpoint_var];

        let options = {
            method: 'POST',
            baseUrl: endpoint,
            url: 'translate',
            qs: {
              'api-version': '3.0',
              'to': ['en']
            },
            headers: {
              'Ocp-Apim-Subscription-Key': subscriptionKey,
              'Content-type': 'application/json',
              'X-ClientTraceId': uuidv4().toString()
            },
            body: [{
                  'text': text
            }],
            json: true,
        };

        request(options, function(err, res, body){
            _callback(body[0]);
        });
    }
    
}

module.exports.QnABot = QnABot;
