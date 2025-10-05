export const getMessaging = jest.fn(() => ({
  send: jest.fn(),
  sendEachForMulticast: jest.fn(),
}));
