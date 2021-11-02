let horizontalMenuButtons = [];
let menus = 0;

const HorizontalMenu = function(buttons) {
	let buttonsHTML = "";
	menus++;
	buttons.forEach(function(button) {
		let m = menus;
		button = {
			...button,
			menuID: m,
			getMenu: function() { return $("#horizontalMenu" + m) },
			getMessage: function() { return $("#horizontalMenu" + m).parent().parent().parent() },
			getMessageLine: function() { return $("#horizontalMenu" + menus).parent().find(".msg-flex .msgln") }
		};
		horizontalMenuButtons.push(button);
		buttonsHTML += `<div class="horizontalMenuItem" onclick="horizontalMenuButtons[${horizontalMenuButtons.length - 1}]['click'](horizontalMenuButtons[${horizontalMenuButtons.length - 1}])"><i class="material-icons">${button.icon}</i></div>\n`;
	});
	return `
		<div class="horizontalMenu" id="horizontalMenu${menus}">
			${buttonsHTML}
		</div>
	`;
};
