// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const request = require("request");
const uuidv4 = require("uuid/v4");
const CurrentLanguage = require("./CurrentLanguage");

const {
  ComponentDialog,
  DialogSet,
  DialogTurnStatus,
  WaterfallDialog
} = require("botbuilder-dialogs");

const {
  QnAMakerBaseDialog,
  QNAMAKER_BASE_DIALOG,
  DefaultCardNoMatchResponse,
  DefaultCardNoMatchText,
  DefaultCardTitle,
  DefaultNoAnswer,
  DefaultThreshold,
  DefaultTopN,
  QnAOptions,
  QnADialogResponseOptions
} = require("./qnamakerBaseDialog");

const INITIAL_DIALOG = "initial-dialog";
const ROOT_DIALOG = "root-dialog";

class RootDialog extends ComponentDialog {
  /**
   * Root dialog for this bot.
   * @param {QnAMaker} qnaService A QnAMaker service object.
   */
  constructor(qnaService) {
    super(ROOT_DIALOG);

    // Initial waterfall dialog.
    this.addDialog(
      new WaterfallDialog(INITIAL_DIALOG, [this.startInitialDialog.bind(this)])
    );

    this.addDialog(new QnAMakerBaseDialog(qnaService));

    this.initialDialogId = INITIAL_DIALOG;
  }

  /**
   * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
   * If no dialog is active, it will start the default dialog.
   * @param {*} turnContext
   * @param {*} accessor
   */
  async run(context, accessor) {
    context._activity.text = await outputLuis(await inputTranslate(context._activity.text));

    const dialogSet = new DialogSet(accessor);
    dialogSet.add(this);

    const dialogContext = await dialogSet.createContext(context);
    const results = await dialogContext.continueDialog();
    if (results.status === DialogTurnStatus.empty) {
      await dialogContext.beginDialog(this.id);
    }
  }

  // This is the first step of the WaterfallDialog.
  // It kicks off the dialog with the QnA Maker with provided options.
  async startInitialDialog(step) {
    // Set values for generate answer options.
    var qnamakerOptions = {
      scoreThreshold: DefaultThreshold,
      top: DefaultTopN,
      context: {}
    };

    // Set values for dialog responses.
    var qnaDialogResponseOptions = {
      noAnswer: DefaultNoAnswer,
      activeLearningCardTitle: DefaultCardTitle,
      cardNoMatchText: DefaultCardNoMatchText,
      cardNoMatchResponse: DefaultCardNoMatchResponse
    };

    var dialogOptions = {};
    dialogOptions[QnAOptions] = qnamakerOptions;
    dialogOptions[QnADialogResponseOptions] = qnaDialogResponseOptions;

    return await step.beginDialog(QNAMAKER_BASE_DIALOG, dialogOptions);
  }
}

// wrap a request in an promise
function translateRequest(text) {
  var subscriptionKey = process.env["TRANSLATOR_TEXT_SUBSCRIPTION_KEY"];
  var endpoint = process.env["TRANSLATOR_TEXT_ENDPOINT"];
  let options = {
    method: "POST",
    baseUrl: endpoint,
    url: "translate",
    qs: {
      "api-version": "3.0",
      to: ["en"]
    },
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Content-type": "application/json",
      "X-ClientTraceId": uuidv4().toString()
    },
    body: [
      {
        text: text
      }
    ],
    json: true
  };
  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      resolve(body);
    });
  });
}

async function inputTranslate(text) {
  let output;
  try {
    const html = await translateRequest(text);
    CurrentLanguage.set(html[0].detectedLanguage.language);
    output = html[0].translations[0].text;
  } catch (error) {
    console.error("ERROR:");
    console.error(error);
  }
  return await output;
}

function luisRequest(text) {
  var subscriptionKey = "931c1058651841bd9771490ef1c38e88";
  var appId = "95566d9c-e113-4c27-b4af-a1117d3f2ce3";
  var endpoint = process.env["LUIS_EDNPOINT"] + appId +
    "?subscription-key=" + subscriptionKey + "&q=" + text;

  let options = {
    method: "GET",
    url: endpoint,
    json: true
  };

  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      resolve(body);
    });
  });
}

async function outputLuis(text) {
  let output;
  try {
    const html = await luisRequest(text);
    output = html["topScoringIntent"].intent;
  } catch (error) {
    console.error("ERROR:");
    console.error(error);
  }
  return await output;
}

module.exports.RootDialog = RootDialog;
