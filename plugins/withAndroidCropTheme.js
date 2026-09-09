const {withAndroidColors} = require('@expo/config-plugins');

module.exports = function withAndroidCropTheme(config) {
    return withAndroidColors(config, async (config) => {
        const colors = config.modResults;

        // Гарантируем наличие массива resources.color
        if (!colors.resources) {
            colors.resources = {};
        }
        if (!colors.resources.color) {
            colors.resources.color = [];
        }

        // Определяем правильные цветовые ресурсы UCrop
        const cropColors = [
            {$: {name: 'ucrop_color_toolbar_widget'}, _: '#FFFFFF'},
            {$: {name: 'ucrop_color_title'}, _: '#FFFFFF'},
            {$: {name: 'ucrop_color_act_widget'}, _: '#FFFFFF'},
        ];

        // Добавляем или обновляем их в colors.xml без дублирования
        cropColors.forEach((newColor) => {
            const existingIndex = colors.resources.color.findIndex(
                (c) => c.$.name === newColor.$.name
            );

            if (existingIndex !== -1) {
                colors.resources.color[existingIndex] = newColor;
            } else {
                colors.resources.color.push(newColor);
            }
        });

        return config;
    });
};