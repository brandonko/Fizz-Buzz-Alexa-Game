# Fizz-Buzz-Alexa-Game

This is a simple Alexa program that allows users to play the interactive math game known as "Fizz Buzz".

## Building the Application

I started working on this Alexa project by first looking through the provided documentation. I skimmed over some basic projects, and familiarized myself with the API. Next, I began playing around with the Alexa developer platform. I used two sample projects to build an understanding of the functions of the console. I noticed that there was [one sample project](https://github.com/alexa/skill-sample-nodejs-highlowgame) that was similar to the project that I was trying to build, and used it as reference to begin coding.

I first copied over the code from the sample project and took some time to understand the logic of the game as well as the control flow of the Alexa interactions. Then, I began rewriting the logic behind the game, changing it based on the rules of Fizz Buzz. I also created a FizzBuzzResponse slot type to store the fizz/buzz value. This value contains a validation setting that will only match "fizz" or "buzz". Using a high fallbackIntentSensitivity as well as this validation, unknown user responses will not be accepted as the wrong answer, but instead will trigger the fallback response (which re-prompts the user to say something).

An extention to the original specs for this game I added is the response rate. After playing a few rounds with my friends, I noticed that it is hard to gauge the winner, since Alexa always wins. By calculating the response rate per round as well as aggregating the average response rate, we could accurately compare who was the faster responder and who lasted more rounds. 

This application is designed to be as robust as possible, being able to understand a wide variety of user responses to take the appropriate action. It is able to repeat statements, help users understand the game, and prompt users to take action based on the state of the game. To be able to comprehend even more, the intents should have a bigger dataset of vocabulary (the current intents only have one or two sample words).