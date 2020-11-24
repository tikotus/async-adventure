// Uncomment this import for fast rendering comparable to React in speed (only rendering what has changed),
// then remove the custom html and render implementations below.
// import { html, render } from "https://unpkg.com/lit-html?module";
const html = String.raw;
function render(str, node) {
  node.innerHTML = str;
}

const config = {
  weapons: [
    { name: "Sword", attack: 6, dodge: 12 },
    { name: "Bow", attack: 4, dodge: 16 },
    { name: "Magic", attack: 8, dodge: 10 },
  ],
  enemies: [
    { name: "Wolf", strength: 4, score: 1 },
    { name: "Troll", strength: 6, score: 4 },
    { name: "Balrog", strength: 8, score: 9 },
  ],
};

(async () => {
  while (true) {
    const name = await ChooseName();
    const weapon = await ChooseWeapon(name);
    const score = await Adventure(name, weapon);
    await GameOver(name, score);
  }
})();

async function ChooseName() {
  render(
    html`
      <h1>Greetings Adventurer</h1>
      <p>Choose your name</p>
      <input id="name" type="text" />
      <br />
      <button id="ok">Done</button>
    `,
    document.getElementById("app")
  );

  await click("ok");

  const name = document.getElementById("name").value;
  render(
    html`
      <h1>Welcome, ${name}!</h1>
      <button id="ok">Thanks!</button>
    `,
    document.getElementById("app")
  );

  await click("ok");

  return name;
}

async function ChooseWeapon(name) {
  render(
    html`
      <h1>Now it's time for you ${name} to choose your weapon</h1>
      ${config.weapons
        .map(
          (weapon, i) =>
            html`<button id="weapon-${i}">
              <h2><strong>${weapon.name}</strong></h2>
              <p>Attack: ${weapon.attack}<br />Dodge: ${weapon.dodge}</p>
            </button>`
        )
        .join("")}
    `,
    document.getElementById("app")
  );

  // This kind of construct is quite common and can be turned into a function.
  const weaponButtons = Array.from(
    document.querySelectorAll("[id^='weapon-']")
  );
  const selectedWeaponButtonId = await Promise.race(
    weaponButtons.map((button) => click(button.id))
  );
  const weaponIndex = parseInt(selectedWeaponButtonId.split("-")[1]);
  const weapon = config.weapons[weaponIndex];

  render(
    html`
      <h1>You chose ${weapon.name}</h1>
      <button id="ok">Nice!</button>
    `,
    document.getElementById("app")
  );

  await click("ok");

  return weapon;
}

async function Adventure(name, weapon) {
  let hitPoints = 3;
  let score = 0;
  let enemyIndex = 0;
  while (hitPoints > 0) {
    let enemy = config.enemies[enemyIndex % config.enemies.length];

    let enemyKilled = false;
    while (hitPoints > 0 && !enemyKilled) {
      const enemyRoll = Math.floor(Math.random() * enemy.strength) + 1;

      render(
        Encounter(enemy, enemyRoll, hitPoints, weapon),
        document.getElementById("app")
      );

      const playerAction = await Promise.race([
        click("attack"),
        click("dodge"),
      ]);

      switch (playerAction) {
        case "attack":
          if (await Attack(enemyRoll, enemy)) {
            enemyKilled = true;
            score += enemy.score;
            ++enemyIndex;
          } else --hitPoints;
          break;
        case "dodge":
          if (!(await Dodge(enemyRoll, enemy))) --hitPoints;
          break;
      }
    }
  }

  return score;

  // Note how visualization can be completely separated from logic.
  // No input handling or anything here. Just pure view.
  function Encounter(enemy, enemyRoll, hitPoints, weapon) {
    return html`
      <h1>You encounter a ${enemy.name} (${enemy.strength})</h1>
      <p>Your hitpoints: ${hitPoints}</p>
      <div id="fight">
        <p>Enemy rolls ${enemyRoll}</p>
        <button id="attack">Attack (1-${weapon.attack})</button>
        <button id="dodge">Dodge (1-${weapon.dodge})</button>
      </div>
    `;
  }

  async function Attack(enemyRoll, enemy) {
    const playerRoll = await Roll(enemyRoll, weapon.attack);
    const success = playerRoll > enemyRoll;

    render(
      success
        ? html`
            <h2>You defeat the ${enemy.name}! <br />Score +${enemy.score}</h2>
          `
        : html`
            <h2>
              You try to attack but the ${enemy.name} is too fast for you.
              <br />
              -1 HP
            </h2>
          `,
      document.getElementById("app")
    );

    await new Promise((resolve) => window.setTimeout(resolve, 2500));

    return success;
  }

  async function Dodge(enemyRoll, enemy) {
    const playerRoll = await Roll(enemyRoll, weapon.dodge);
    const success = playerRoll > enemyRoll;

    render(
      success
        ? html` <h1>You succesfully dodge the ${enemy.name}'s attack!</h1> `
        : html`
            <h1>
              You try to dodge the ${enemy.name}'s attack but fail.
              <br />
              -1 HP
            </h1>
          `,
      document.getElementById("app")
    );

    await new Promise((resolve) => window.setTimeout(resolve, 1500));

    return success;
  }

  async function Roll(enemyRoll, max) {
    const roll = () => Math.floor(Math.random() * max) + 1;
    const playerRoll = roll();

    // Animated roll
    for (let i = 0; i <= 10; ++i) {
      render(
        html`
          <p>Enemy rolls ${enemyRoll}</p>
          <p>You roll ${i === 10 ? playerRoll : roll()}</p>
        `,
        document.getElementById("app")
      );
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }

    await new Promise((resolve) => window.setTimeout(resolve, 1000));

    return playerRoll;
  }
}

async function GameOver(name, score) {
  render(
    html`
      <h1>You die! Farewell ${name}...</h1>
      <p>Your final score is: ${score}</p>
      <button id="retry">Retry?</button>
    `,
    document.getElementById("app")
  );

  await click("retry");
}

// A tiny helper.
// Not suitable for production, a method of cancellation is needed to avoid potential memory leaks.
async function click(id) {
  const element = document.getElementById(id);
  return await new Promise((resolve) => {
    element.addEventListener("click", () => resolve(id), { once: true });
  });
}
