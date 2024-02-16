export const subject = "smach.ecore";
export const links = [
  {
    source: "smach.ecore",
    target: "ros.ecore",
    type: "unidirectional",
    relationtype: "Dependency",
    value: "",
  },
  {
    source: "ros.ecore",
    target: "smach.ecore",
    type: "unidirectional",
    relationtype: "Dependency",
    value: "",
  },
];

export const nodes = {
  "smach.ecore": {
    name: "smach.ecore",
    type: "Metamodel",
    info: "smach.ecore",
    virtual: "concrete",
    quality: {
      Complexity: "21.0",
      Understandability: "1.3809523582458496",
    },
  },
  "ros.ecore": {
    name: "ros.ecore",
    type: "Metamodel",
    info: "ros.ecore",
    virtual: "concrete",
    quality: {
      Complexity: "21.0",
      Understandability: "1.3809523582458496",
    },
  },
};
