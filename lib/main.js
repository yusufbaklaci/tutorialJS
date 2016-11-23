

function initialiseTutorial(){
  //save the shown guiders to the cookie to skip them later
  //tutorial.cookieControl = true;

  tutorial.init([
  {steps: [
    {
        id: "start",
        title: "Guider with title and description",
        description: "This is a step by step guider with an overlay.",
        highlight: 1
    },
    {
        id: "tutorialTrigger",
        attachTo: "#tutorialTrigger",
        position: 9,
        title: "This forces the user to click on this button.",
        description: "This way you have interactive guiders.",
        highlight:1,
        onClick:1
    },
    {
        id: "Great",
        title: "Great! You clicked on the button successfully."
    }]}
]);
}