let _soundboardEnabled = false;

export const getSoundboardRoomEnabled = () => _soundboardEnabled;
export const setSoundboardRoomEnabled = (enabled: boolean) =>
{
    _soundboardEnabled = enabled;
};
