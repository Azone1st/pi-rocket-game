function launchRocket(multiplier) {
  const rocket = document.getElementById("rocket");
  rocket.style.transform = `translateY(-${multiplier * 20}vh)`;

  setTimeout(() => {
    rocket.style.transform = "translateY(0)";
  }, 4000);
}
