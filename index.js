const Alexa = require('ask-sdk');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const languageStrings = {
	'en': require('./languageStrings')
}

// Launches the game, and initializes the variables used to store information about the gameplay.
const LaunchRequest = {
	canHandle(handlerInput) {
    // launch requests as well as any new session, as games are not saved in progress, which makes
    // no one shots a reasonable idea except for help, and the welcome message provides some help.
    return Alexa.isNewSession(handlerInput.requestEnvelope) 
    || Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
},
async handle(handlerInput) {
	const { attributesManager } = handlerInput;
	const requestAttributes = attributesManager.getRequestAttributes();
	const attributes = await attributesManager.getPersistentAttributes() || {};

	if (Object.keys(attributes).length === 0) {
		attributes.endedSessionCount = 0;
		attributes.gamesPlayed = 0;
		attributes.gameState = 'ENDED';
	}

	attributesManager.setSessionAttributes(attributes);

	const gamesPlayed = attributes.gamesPlayed.toString()
	const speechOutput = requestAttributes.t('LAUNCH_MESSAGE', gamesPlayed);
	const reprompt = requestAttributes.t('CONTINUE_MESSAGE');

	return handlerInput.responseBuilder
	.speak(speechOutput)
	.reprompt(reprompt)
	.getResponse();
},
};

// Exits the game, and displays an exit message to the user.
const ExitHandler = {
	canHandle(handlerInput) {
		return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
		&& (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
			|| Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
	},
	handle(handlerInput) {
		const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

		return handlerInput.responseBuilder
		.speak(requestAttributes.t('EXIT_MESSAGE'))
		.getResponse();
	},
};

// Catch session ended request, and output the session ending reason.
const SessionEndedRequest = {
	canHandle(handlerInput) {
		return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
	},
	handle(handlerInput) {
		console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
		return handlerInput.responseBuilder.getResponse();
	},
};

// Provides help to the user, which is information about the game.
const HelpIntent = {
	canHandle(handlerInput) {
		return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' 
		&& Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
	},
	handle(handlerInput) {
		const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

		return handlerInput.responseBuilder
		.speak(requestAttributes.t('HELP_MESSAGE'))
		.reprompt(requestAttributes.t('HELP_REPROMPT'))
		.getResponse();
	},
};

// User responds yes, which means we will begin a game (if we are not already in one).
const YesIntent = {
	canHandle(handlerInput) {
    // only start a new game if yes is said when not playing a game.
    let isCurrentlyPlaying = false;
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.gameState &&
    	sessionAttributes.gameState === 'STARTED') {
    	isCurrentlyPlaying = true;
}

return !isCurrentlyPlaying 
&& Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' 
&& Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
},
handle(handlerInput) {
	const { attributesManager } = handlerInput;
	const requestAttributes = attributesManager.getRequestAttributes();
	const sessionAttributes = attributesManager.getSessionAttributes();
	
    // Set up game states
    sessionAttributes.gameState = 'STARTED';
    sessionAttributes.nextNumber = 2;
    sessionAttributes.nextNumberForAlexa = '1';
    let d = new Date();
    sessionAttributes.time = d.getTime();
    sessionAttributes.totalTime = 0;


    return handlerInput.responseBuilder
    .speak(requestAttributes.t('YES_MESSAGE'))
    .reprompt(requestAttributes.t('HELP_REPROMPT'))
    .getResponse();
},
};

// User does not want to play the game, so we will exit (if we are not in game).
const NoIntent = {
	canHandle(handlerInput) {
    // only treat no as an exit when outside a game
    let isCurrentlyPlaying = false;
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.gameState &&
    	sessionAttributes.gameState === 'STARTED') {
    	isCurrentlyPlaying = true;
}

return !isCurrentlyPlaying 
&& Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' 
&& Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent';
},
async handle(handlerInput) {
	const { attributesManager } = handlerInput;
	const requestAttributes = attributesManager.getRequestAttributes();
	const sessionAttributes = attributesManager.getSessionAttributes();

	sessionAttributes.endedSessionCount += 1;
	sessionAttributes.gameState = 'ENDED';
	attributesManager.setPersistentAttributes(sessionAttributes);

	await attributesManager.savePersistentAttributes();

	return handlerInput.responseBuilder
	.speak(requestAttributes.t('EXIT_MESSAGE'))
	.getResponse();

},
};

// Catch the other intents with a continue message.
const UnhandledIntent = {
	canHandle() {
		return true;
	},
	handle(handlerInput) {
		const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

		return handlerInput.responseBuilder
		.speak(requestAttributes.t('CONTINUE_MESSAGE'))
		.reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
		.getResponse();
	},
};

// User provides their response for the game.
// Fizz buzz game logic is built here.
const NextNumberIntent = {
	canHandle(handlerInput) {
    // handle numbers only during a game
    let isCurrentlyPlaying = false;
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.gameState &&
    	sessionAttributes.gameState === 'STARTED') {
    	isCurrentlyPlaying = true;
}

return isCurrentlyPlaying 
&& Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' 
&& Alexa.getIntentName(handlerInput.requestEnvelope) === 'NextNumberIntent';
},
async handle(handlerInput) {
	const { attributesManager } = handlerInput;
	const requestAttributes = attributesManager.getRequestAttributes();
	const sessionAttributes = attributesManager.getSessionAttributes();

	// Determine the user's response and act appropriately
	const targetResponse = fizzOrBuzz(sessionAttributes.nextNumber)
	let userResponseNumber = parseInt(Alexa.getSlotValue(handlerInput.requestEnvelope, 'number'), 10);
	let fizzBuzzResponse = Alexa.getSlotValue(handlerInput.requestEnvelope, 'FizzBuzz');
	let isNumber = typeof targetResponse === "number"

	if ((isNumber && userResponseNumber === targetResponse) || (!isNumber && fizzBuzzResponse === targetResponse)) {
		// User responsed correctly
		let nextNumberForAlexa = fizzOrBuzz(sessionAttributes.nextNumber + 1);
		sessionAttributes.nextNumberForAlexa = nextNumberForAlexa.toString();
		sessionAttributes.nextNumber += 2;
		var d = new Date();
		let timePassed = (d.getTime() - sessionAttributes.time) / 1000;
		sessionAttributes.time = d.getTime();
		sessionAttributes.totalTime += timePassed;
		return handlerInput.responseBuilder
		.speak(nextNumberForAlexa.toString() + '. Your respone time was ' + timePassed.toString() + ' seconds.')
		.reprompt('I said ' + nextNumberForAlexa.toString() + '. It is your turn!')
		.getResponse();
	} else {
		// User did not respond correctly
		sessionAttributes.gamesPlayed += 1;
		sessionAttributes.gameState = 'ENDED';
		attributesManager.setPersistentAttributes(sessionAttributes);
		let numRounds = sessionAttributes.nextNumber / 2
		let averageResponseRate = sessionAttributes.totalTime / numRounds;
		await attributesManager.savePersistentAttributes();
		return handlerInput.responseBuilder
		.speak(requestAttributes.t('LOST_MESSAGE', (fizzBuzzResponse ? fizzBuzzResponse : userResponseNumber.toString()), targetResponse.toString(), numRounds.toString(), averageResponseRate.toString()))
		.reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
		.getResponse();
	}
},
};

// Catch any errors that occur during these interactions.
const ErrorHandler = {
	canHandle() {
		return true;
	},
	handle(handlerInput, error) {
		console.log(`Error handled: ${error.message}`);
		console.log(`Error stack: ${error.stack}`);
		const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

		return handlerInput.responseBuilder
		.speak(requestAttributes.t('ERROR_MESSAGE'))
		.reprompt(requestAttributes.t('ERROR_MESSAGE'))
		.getResponse();
	},
};

// Will catch intents that don't fall into a category while in game and out of game
const FallbackHandler = {
	canHandle(handlerInput) {
    // handle fallback intent, yes and no when playing a game
    // for yes and no, will only get here if and not caught by the normal intent handler
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
    && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent' 
    	|| Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
    	|| Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent');
},
handle(handlerInput) {
	const { attributesManager } = handlerInput;
	const requestAttributes = attributesManager.getRequestAttributes();
	const sessionAttributes = attributesManager.getSessionAttributes();

	if (sessionAttributes.gameState && sessionAttributes.gameState === 'STARTED') {
      // currently playing, respond with the last number that was spoken
      return handlerInput.responseBuilder
      .speak(requestAttributes.t('FALLBACK_MESSAGE_DURING_GAME', sessionAttributes.nextNumberForAlexa))
      .reprompt(requestAttributes.t('FALLBACK_MESSAGE_DURING_GAME', sessionAttributes.nextNumberForAlexa))
      .getResponse();
  }

    // not playing
    return handlerInput.responseBuilder
    .speak(requestAttributes.t('FALLBACK_MESSAGE_OUTSIDE_GAME'))
    .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
    .getResponse();
},
};

const LocalizationInterceptor = {
	process(handlerInput) {
		const localizationClient = i18n.use(sprintf).init({
			lng: Alexa.getLocale(handlerInput.requestEnvelope),
			resources: languageStrings,
		});
		localizationClient.localize = function localize() {
			const args = arguments;
			const values = [];
			for (let i = 1; i < args.length; i += 1) {
				values.push(args[i]);
			}
			const value = i18n.t(args[0], {
				returnObjects: true,
				postProcess: 'sprintf',
				sprintf: values,
			});
			if (Array.isArray(value)) {
				return value[Math.floor(Math.random() * value.length)];
			}
			return value;
		};
		const attributes = handlerInput.attributesManager.getRequestAttributes();
		attributes.t = function translate(...args) {
			return localizationClient.localize(...args);
		};
	},
};

function getPersistenceAdapter() {
   // Determines persistence adapter to be used based on environment
   const s3Adapter = require('ask-sdk-s3-persistence-adapter');
   return new s3Adapter.S3PersistenceAdapter({
   	bucketName: process.env.S3_PERSISTENCE_BUCKET,
   });
}

// Determine the correct fizz buzz response given a number
function fizzOrBuzz(num) {
	if (num % 3 === 0 && num % 5 !== 0) return "fizz";
	if (num % 5 === 0 && num % 3 !== 0) return "buzz";
	if (num % 3 === 0 && num % 5 === 0) return "fizz buzz";
	return num;
}

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
.withPersistenceAdapter(getPersistenceAdapter())
.addRequestHandlers(
	LaunchRequest,
	ExitHandler,
	SessionEndedRequest,
	HelpIntent,
	YesIntent,
	NoIntent,
	NextNumberIntent,
	FallbackHandler,
	UnhandledIntent,
	)
.addRequestInterceptors(LocalizationInterceptor)
.addErrorHandlers(ErrorHandler)
.lambda();
