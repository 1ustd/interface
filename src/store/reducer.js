const initState = {
  address: "",
  userId: -1,
  inviteContract: "0x28aAec993079403D82d7Ec6A0d8b5bB16317E08b",
  poolManager: "0x6Ea249D3087F64472e689036648416c3FF685FBa",
  reModalOpen: false,
};

const reducer = (state = initState, action) => {
  switch (action.type) {
    case "CHANGE_ADDRESS":
      return {
        ...state,
        address: action.payload,
      };

    case "CHANGE_USER":
      return {
        ...state,
        userId: action.payload,
      };
    case "CHANGE_REMODAL":
      return {
        ...state,
        reModalOpen: action.payload,
      };
    case "CHANGE_INVITE_CONTRACT":
      return {
        ...state,
        inviteContract: action.payload,
      };
    case "CHANGE_POOL_MANAGER":
      return {
        ...state,
        poolManager: action.payload,
      };
    default:
      return state;
  }
};

export default reducer;
