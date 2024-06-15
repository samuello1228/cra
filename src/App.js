import './App.css';
import { useState, useEffect, createElement } from "react"
import input_file from "./json/book.json"
import shasum from 'crypto-js/sha1'

function App() {
  const addParenthesis = (option, inner, setID, always = false) => {
    let output = ""

    const exception =
      inner.type === "constants" ||
      inner.type === "variable" ||
      inner.type === "variable_declare" ||
      (inner.type === "operators" && inner.name === "set_builder")

    let parenthesis_option = ""
    if (contain_big_notation(inner)) parenthesis_option = " stretchy='true'"
    else parenthesis_option = " stretchy='false'"

    if (!exception || always) {
      output += "<mo " + option + parenthesis_option + ">(</mo>"
    }

    output += getExpressionHTML(inner, setID)

    if (!exception || always) {
      output += "<mo " + option + parenthesis_option + ">)</mo>"
    }

    return output
  }

  const is_found_alias_name = (all_deps, alias_name) => {
    for (let deps of all_deps) {
      if (deps.find(dep => (dep.variable.alias ?? dep.variable.name) === alias_name)) {
        return true
      }
    }
    return false
  }

  const symbols = {}
  // constants
  symbols.constants = []
  symbols.constants.push(
    {
      name: "boolean",
      //<mi mathvariant="double-struck">B</mi>
      button_mml: createElement("mi", { mathvariant: "double-struck" }, "B"),
      belongs: ["collection_of_sets"],
      setTarget: () => { },
      getHTML: ({ option }) => "<mi mathvariant='double-struck' " + option + ">B</mi>",
    }
  )

  symbols.constants.push(
    {
      name: "True",
      //<mtext>True</mtext>
      button_mml: createElement("mtext", {}, "True"),
      belongs: ["boolean"],
      setTarget: () => { },
      getHTML: ({ option }) => "<mtext " + option + ">True</mtext>",
    }
  )

  symbols.constants.push(
    {
      name: "False",
      //<mtext>False</mtext>
      button_mml: createElement("mtext", {}, "False"),
      belongs: ["boolean"],
      setTarget: () => { },
      getHTML: ({ option }) => "<mtext " + option + ">False</mtext>",
    }
  )

  symbols.constants.push(
    {
      name: "empty_set",
      //<mi>&#x2205;</mi>
      button_mml: createElement("mi", {}, "&#x2205;"),
      belongs: [],
      setTarget: () => { },
      getHTML: ({ option }) => "<mi " + option + ">&#x2205;</mi>",
    }
  )

  symbols.constants.push(
    {
      name: "natural_number",
      //<mi mathvariant="double-struck">N</mi>
      button_mml: createElement("mi", { mathvariant: "double-struck" }, "N"),
      belongs: ["collection_of_sets"],
      setTarget: () => { },
      getHTML: ({ option }) => "<mi mathvariant='double-struck' " + option + ">N</mi>",
    }
  )

  symbols.constants.push(
    {
      name: "integer",
      //<mi mathvariant="double-struck">N</mi>
      button_mml: createElement("mi", { mathvariant: "double-struck" }, "Z"),
      belongs: ["collection_of_sets"],
      setTarget: () => { },
      getHTML: ({ option }) => "<mi mathvariant='double-struck' " + option + ">Z</mi>",
    }
  )

  symbols.constants.push(
    {
      name: "zero",
      button_mml: createElement("mn", {}, "0"),
      belongs: ["integer"],
      setTarget: () => { },
      getHTML: ({ option }) => "<mn " + option + ">0</mn>",
    }
  )

  symbols.constants.push(
    {
      name: "one",
      button_mml: createElement("mn", {}, "1"),
      belongs: ["integer"],
      setTarget: () => { },
      getHTML: ({ option }) => "<mn " + option + ">1</mn>",
    }
  )

  symbols.constants.push(
    {
      name: "two",
      button_mml: createElement("mn", {}, "2"),
      belongs: ["integer"],
      setTarget: () => { },
      getHTML: ({ option }) => "<mn " + option + ">2</mn>",
    }
  )

  // operators
  symbols.operators = []
  const set_output_sets_aux = (expr, input_set) => {
    if (expr.deps !== undefined) {
      for (let dep of expr.deps) {
        dep.set.output_set = "collection_of_sets"
      }
    }

    if (expr.operands !== undefined) {
      for (let operand of expr.operands) {
        operand.output_set = input_set
      }
    }
  }

  symbols.operators.push(
    {
      name: "not",
      //<mo>&#xAC;</mo>
      button_mml: createElement("mo", {}, "&#xAC;"),
      output_set: "boolean",
      setTarget: ({ target }) => {
        target.operands = []
        target.operands.push({ type: null, output_set: "boolean", id: newID })
        setNewID(newID + 1)
      },
      getHTML: ({ expr, option, setID }) => {
        let output = ""
        output += "<mo " + option + ">&#xAC;</mo>"
        output += addParenthesis(option, expr.operands[0], setID)
        return output
      },
      set_output_sets: expr => { set_output_sets_aux(expr, "boolean") },
    }
  )

  const setTarget_deps_super = target => {
    target.deps = []

    let variable_name
    for (let i = 97; i <= 122; i++) {
      variable_name = String.fromCharCode(i)
      if (target.ext_deps.find(dep => dep.variable.name === variable_name)) continue
      break
    }

    let dep_new = {
      variable: { type: "variable_declare", name: variable_name, id: newID },
      set: { type: null, output_set: "collection_of_sets", id: newID + 1 }
    }

    if (is_found_alias_name([target.ext_deps], variable_name)) {
      let alias_name
      for (let i = 97; i <= 122; i++) {
        alias_name = String.fromCharCode(i)
        if (is_found_alias_name([target.ext_deps], alias_name)) continue
        break
      }
      dep_new.variable.alias = alias_name
    }

    target.deps.push(dep_new)
  }

  const extend_deps_super = target => {
    let variable_name
    for (let i = 97; i <= 122; i++) {
      variable_name = String.fromCharCode(i)
      if (target.ext_deps.find(dep => dep.variable.name === variable_name)) continue
      if (target.int_deps.find(dep => dep.variable.name === variable_name)) continue
      if (target.deps.find(dep => dep.variable.name === variable_name)) continue
      break
    }

    let dep_new = {
      variable: { type: "variable_declare", name: variable_name, id: newID },
      set: { type: null, output_set: "collection_of_sets", id: newID + 1 }
    }

    if (is_found_alias_name([target.ext_deps, target.int_deps, target.deps], variable_name)) {
      let alias_name
      for (let i = 97; i <= 122; i++) {
        alias_name = String.fromCharCode(i)
        if (is_found_alias_name([target.ext_deps, target.int_deps, target.deps], alias_name)) continue
        break
      }
      dep_new.variable.alias = alias_name
    }

    target.deps.push(dep_new)
  }

  const setTarget_extensible = ({ target, isSuper, input_set }) => {
    if (!isSuper) {
      target.operands = []
      target.operands.push({ type: null, output_set: input_set, id: newID })
      target.operands.push({ type: null, output_set: input_set, id: newID + 1 })
      setNewID(newID + 2)
    }
    else {
      setTarget_deps_super(target)

      target.operands = []
      target.operands.push({ type: null, output_set: input_set, id: newID + 2 })
      setNewID(newID + 3)
    }
  }

  const extend_extensible = (target, input_set) => {
    if (target.isSuper === undefined) {
      target.operands.push({ type: null, output_set: input_set, id: newID })
      setNewID(newID + 1)
    }
    else {
      extend_deps_super(target)
      setNewID(newID + 2)
    }
  }

  const shrink_extensible = target => {
    if (target.isSuper === undefined) {
      target.operands.pop()
    }
    else {
      target.deps.pop()
    }
  }

  const shrink_condition_extensible = target => (
    target.isSuper === undefined && target.operands.length >= 3 ||
    target.isSuper !== undefined && target.deps.length >= 2)

  symbols.operators.push(
    {
      name: "and",
      //<mo>&#x2227;</mo>
      button_mml: createElement("mo", {}, "&#x2227;"),
      output_set: "boolean",
      extensible: true,
      //<mo>&#x2200;</mo>
      button_mml_super: createElement("mo", {}, "&#x2200;"),
      setTarget: ({ target, isSuper }) => { setTarget_extensible({ target, isSuper, input_set: "boolean" }) },
      getHTML: ({ expr, option, setID }) => {
        let output = ""
        if (expr.isSuper === undefined) {
          for (let i = 0; i < expr.operands.length; i++) {
            if (i !== 0) output += "<mo " + option + ">&#x2227;</mo>"
            output += addParenthesis(option, expr.operands[i], setID)
          }
        }
        else {
          for (let dep of expr.deps) {
            output += "<mo " + option + ">&#x2200;</mo>"
            output += addParenthesis(option, dep.variable, setID)
            output += "<mo " + option + ">&#x2208;</mo>"
            output += addParenthesis(option, dep.set, setID)
          }

          output += addParenthesis(option, expr.operands[0], setID, true)
        }
        return output
      },
      extend: target => { extend_extensible(target, "boolean") },
      extend_condition: target => true,
      shrink: shrink_extensible,
      shrink_condition: shrink_condition_extensible,
      set_output_sets: expr => { set_output_sets_aux(expr, "boolean") },
    }
  )

  symbols.operators.push(
    {
      name: "or",
      //<mo>&#x2228;</mo>
      button_mml: createElement("mo", {}, "&#x2228;"),
      output_set: "boolean",
      extensible: true,
      //<mo>&#x2203;</mo>
      button_mml_super: createElement("mo", {}, "&#x2203;"),
      setTarget: ({ target, isSuper }) => { setTarget_extensible({ target, isSuper, input_set: "boolean" }) },
      getHTML: ({ expr, option, setID }) => {
        let output = ""
        if (expr.isSuper === undefined) {
          for (let i = 0; i < expr.operands.length; i++) {
            if (i !== 0) output += "<mo " + option + ">&#x2228;</mo>"
            output += addParenthesis(option, expr.operands[i], setID)
          }
        }
        else {
          for (let dep of expr.deps) {
            output += "<mo " + option + ">&#x2203;</mo>"
            output += addParenthesis(option, dep.variable, setID)
            output += "<mo " + option + ">&#x2208;</mo>"
            output += addParenthesis(option, dep.set, setID)
          }

          output += addParenthesis(option, expr.operands[0], setID, true)
        }
        return output
      },
      extend: target => { extend_extensible(target, "boolean") },
      extend_condition: target => true,
      shrink: shrink_extensible,
      shrink_condition: shrink_condition_extensible,
      set_output_sets: expr => { set_output_sets_aux(expr, "boolean") },
    }
  )

  symbols.operators.push(
    {
      name: "implies",
      //<mo>&#x27F9;</mo>
      button_mml: createElement("mo", {}, "&#x27F9;"),
      output_set: "boolean",
      setTarget: ({ target }) => {
        target.operands = []
        target.operands.push({ type: null, output_set: "boolean", id: newID })
        target.operands.push({ type: null, output_set: "boolean", id: newID + 1 })
        setNewID(newID + 2)
      },
      getHTML: ({ expr, option, setID }) => {
        let output = ""
        output += addParenthesis(option, expr.operands[0], setID)
        output += "<mspace width='0.2778em'></mspace>"
        output += "<mo " + option + ">&#x27F9;</mo>"
        output += addParenthesis(option, expr.operands[1], setID)
        return output
      },
      set_output_sets: expr => { set_output_sets_aux(expr, "boolean") },
    }
  )

  symbols.operators.push(
    {
      name: "iff",
      //<mo>&#x27FA;</mo>
      button_mml: createElement("mo", {}, "&#x27FA;"),
      output_set: "boolean",
      setTarget: ({ target }) => {
        target.operands = []
        target.operands.push({ type: null, output_set: "boolean", id: newID })
        target.operands.push({ type: null, output_set: "boolean", id: newID + 1 })
        setNewID(newID + 2)
      },
      getHTML: ({ expr, option, setID }) => {
        let output = ""
        output += addParenthesis(option, expr.operands[0], setID)
        output += "<mspace width='0.6em'></mspace>"
        output += "<mo " + option + ">&#x27FA;</mo>"
        output += addParenthesis(option, expr.operands[1], setID)
        return output
      },
      set_output_sets: expr => { set_output_sets_aux(expr, "boolean") },
    }
  )

  symbols.operators.push(
    {
      name: "in",
      //<mo>&#x2208;</mo>
      button_mml: createElement("mo", {}, "&#x2208;"),
      output_set: "boolean",
      setTarget: ({ target }) => {
        target.operands = []
        target.operands.push({ type: null, output_set: "universal_set", id: newID })
        target.operands.push({ type: null, output_set: "universal_set", id: newID + 1 })
        setNewID(newID + 2)
      },
      getHTML: ({ expr, option, setID }) => {
        let output = ""
        output += addParenthesis(option, expr.operands[0], setID)
        output += "<mo " + option + ">&#x2208;</mo>"
        output += addParenthesis(option, expr.operands[1], setID)
        return output
      },
      set_output_sets: expr => { set_output_sets_aux(expr, "universal_set") },
    }
  )

  symbols.operators.push(
    {
      name: "set_builder",
      //<mo>&#x27FA;</mo>
      button_mml: createElement("mo", {}, "{}"),
      output_set: "collection_of_sets",
      extensible: true,
      button_mml_super: createElement("mo", {}, "{|}"),
      setTarget: ({ target, isSuper }) => {
        if (!isSuper) {
          target.operands = []
          target.operands.push({ type: null, output_set: "universal_set", id: newID })
          setNewID(newID + 1)
        }
        else {
          setTarget_deps_super(target)

          target.operands = []
          target.operands.push({ type: null, output_set: "boolean", id: newID + 2 })
          setNewID(newID + 3)
        }
      },
      getHTML: ({ expr, option, setID }) => {
        let output = ""
        if (expr.isSuper === undefined) {
          output += "<mo " + option + ">{</mo>"
          for (let i = 0; i < expr.operands.length; i++) {
            if (i !== 0) output += "<mo separator='true' " + option + ">,</mo>"

            if (expr.operands.length === 1) output += getExpressionHTML(expr.operands[i], setID)
            else output += addParenthesis(option, expr.operands[i], setID)
          }
          output += "<mo " + option + ">}</mo>"
        }
        else {
          output += "<mo " + option + ">{</mo>"
          output += addParenthesis(option, expr.deps[0].variable, setID)
          output += "<mo " + option + ">&#x2208;</mo>"
          output += addParenthesis(option, expr.deps[0].set, setID)
          output += "<mspace width='0.3em'></mspace>"
          output += "<mo " + option + ">|</mo>"
          output += "<mspace width='0.3em'></mspace>"
          output += getExpressionHTML(expr.operands[0], setID)
          output += "<mo " + option + ">}</mo>"
        }
        return output
      },
      extend: target => {
        target.operands.push({ type: null, output_set: "universal_set", id: newID })
        setNewID(newID + 1)
      },
      extend_condition: target => target.isSuper === undefined,
      shrink: target => { target.operands.pop() },
      shrink_condition: target => (target.isSuper === undefined && target.operands.length >= 2),
      set_output_sets: expr => {
        if (!expr.isSuper) {
          set_output_sets_aux(expr, "universal_set")
        }
        else {
          set_output_sets_aux(expr, "boolean")
        }
      },
    }
  )

  symbols.operators.push(
    {
      name: "equal",
      //<mo>=</mo>
      button_mml: createElement("mo", {}, "="),
      output_set: "boolean",
      setTarget: ({ target }) => {
        target.operands = []
        target.operands.push({ type: null, output_set: "universal_set", id: newID })
        target.operands.push({ type: null, output_set: "universal_set", id: newID + 1 })
        setNewID(newID + 2)
      },
      getHTML: ({ expr, option, setID }) => {
        let output = ""
        output += addParenthesis(option, expr.operands[0], setID)
        output += "<mo " + option + ">=</mo>"
        output += addParenthesis(option, expr.operands[1], setID)
        return output
      },
      set_output_sets: expr => { set_output_sets_aux(expr, "universal_set") },
    }
  )

  symbols.operators.push(
    {
      name: "add",
      //<mo>+</mo>
      button_mml: createElement("mo", {}, "+"),
      output_set: "integer",
      extensible: true,
      //<mo>&#x2211;</mo>
      button_mml_super: createElement("mo", {}, "&#x2211;"),
      setTarget: ({ target, isSuper }) => { setTarget_extensible({ target, isSuper, input_set: "integer" }) },
      getHTML: ({ expr, option, setID }) => {
        let output = ""
        if (expr.isSuper === undefined) {
          for (let i = 0; i < expr.operands.length; i++) {
            if (i !== 0) output += "<mo " + option + ">+</mo>"
            output += addParenthesis(option, expr.operands[i], setID)
          }
        }
        else {
          for (let dep of expr.deps) {
            output += "<munder>"
            output += "<mo " + option + ">&#x2211;</mo>"
            output += "<mrow>"
            output += addParenthesis(option, dep.variable, setID)
            output += "<mo " + option + ">&#x2208;</mo>"
            output += addParenthesis(option, dep.set, setID)
            output += "</mrow>"
            output += "</munder>"
          }

          output += addParenthesis(option, expr.operands[0], setID)
        }
        return output
      },
      extend: target => { extend_extensible(target, "integer") },
      extend_condition: target => true,
      shrink: shrink_extensible,
      shrink_condition: shrink_condition_extensible,
      set_output_sets: expr => { set_output_sets_aux(expr, "integer") },
    }
  )

  const [book, setBook] = useState([])
  const [targetID, setTargetID] = useState(null)
  const [itemID, setItemID] = useState(null)
  const [newID, setNewID] = useState(0)
  const [expandList, setExpandList] = useState([])

  console.log("book:", book)
  console.log("targetID:", targetID)
  console.log("itemID:", itemID)
  console.log("expandList:", expandList)

  const item_from_json = (item, id, ext_deps = []) => {
    //set expression
    item.expression.output_set = "boolean"
    id = expr_from_json(item.expression, id)
    if (item.expression.ext_deps === undefined) item.expression.ext_deps = ext_deps
    updateDependencies(item.expression)

    // for assumptions
    if (item.assumptions !== undefined) {
      for (let assumption of item.assumptions) {
        id = item_from_json(assumption, id)
      }
    }

    // for steps
    if (item.steps !== undefined) {
      for (let step of item.steps) {
        id = item_from_json(step, id)
      }
    }

    // for goals
    if (item.goals !== undefined) {
      for (let goal of item.goals) {
        id = item_from_json(goal, id)
      }
    }

    //set expandList
    setExpandList(list => {
      if (list.find(x => x.id === item.expression.id) === undefined) {
        list.push({ id: item.expression.id, isExpand: false })
      }
      return list
    })

    return id
  }

  const addItem = () => {
    let item_new = { expression: { type: null }, proof_type: null }
    let id = item_from_json(item_new, newID)
    setNewID(id)

    let clone = structuredClone(book)
    if (itemID === null) {
      clone.push(item_new)
    }
    else {
      const { item } = findExpressionByID(clone, itemID)
      if (item.steps === undefined) item.steps = []
      item.steps.push(item_new)
    }

    setBook(clone)
  }

  const add_props_expr = (expr, color = null) => {
    if (expr.id === targetID) color = "green"

    for (let element of document.querySelectorAll(".id" + expr.id)) {
      // set color
      if (color !== null) element.style.color = color
      else element.removeAttribute("style")

      // onclick
      element.addEventListener("click", () => {
        toggleTarget(expr.id)
      })
    }

    if (expr.deps !== undefined) {
      for (let dep of expr.deps) {
        add_props_expr(dep.variable, color)
        add_props_expr(dep.set, color)
      }
    }

    if (expr.operands !== undefined) {
      for (let operand of expr.operands) {
        add_props_expr(operand, color)
      }
    }
  }

  const add_props_item = (item) => {
    add_props_expr(item.expression)

    // for assumptions
    if (item.assumptions !== undefined) {
      for (let assumption of item.assumptions) {
        add_props_item(assumption)
      }
    }

    // for steps
    if (item.steps !== undefined) {
      for (let step of item.steps) {
        add_props_item(step)
      }
    }

    // for goals
    if (item.goals !== undefined) {
      for (let goal of item.goals) {
        add_props_item(goal)
      }
    }

    // for proof_config
    if (item.proof_config !== undefined) {
      if (item.proof_name === "Substitution") {
        for (let name in item.proof_config.substitution) {
          if (item.proof_config.substitution[name].target !== null) {
            add_props_expr(item.proof_config.substitution[name].target)
          }
        }
      }
    }
  }

  const removeAllChildNodes = parent => {
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild)
    }
  }

  useEffect(() => {
    // input from json file
    console.log("json input", input_file)
    let id = newID
    for (let item of input_file) {
      id = item_from_json(item, id)
    }

    setBook(input_file)
    setNewID(id)
  }, [])

  useEffect(() => {
    const root = document.getElementById('math-root')
    removeAllChildNodes(root)

    let id_list = structuredClone(expandList)
    for (let item of book) {
      let box = document.createElement("p")

      let title = document.createElement("div")
      title.style.display = "flex"
      title.style["justify-content"] = "flex-start"
      title.style["background-color"] = "#873600"
      title.style["font-size"] = "1.5rem"

      title.innerHTML = ""
      if (item.proof_type === "Axiom") {
        title.innerHTML += "Axiom: "
      }
      else {
        title.innerHTML += "Proposition: "
      }
      if (item.shasum !== undefined) title.innerHTML += item.shasum.slice(0, 8)

      box.appendChild(title)

      box.appendChild(render_item(item, id_list))

      root.appendChild(box)
    }

    // MathJax.typesetClear()
    MathJax.typeset()

    for (let item of book) {
      add_props_item(item)
    }

    // set button for accordion
    for (let x of id_list) {
      if (x.details_id === undefined) continue
      let button = document.getElementById(x.button_id)
      button.addEventListener("click", event => {
        let clone = structuredClone(expandList)
        let isFound = clone.find(y => y.id === x.id)

        let details = document.getElementById(x.details_id)
        if (details.style.maxHeight === "0px") {
          event.target.innerHTML = "-"
          isFound.isExpand = true
        } else {
          event.target.innerHTML = "+"
          isFound.isExpand = false
        }

        setExpandList(clone)
      })
    }

  }, [book, targetID, expandList])

  useEffect(() => {
    const root = document.getElementById("active-item")
    removeAllChildNodes(root)

    if (itemID === null) {
      const none = document.createElement("span")
      none.innerHTML = "(root)"
      root.appendChild(none)
    }
    else {
      const { item } = findExpressionByID(book, itemID)
      root.appendChild(createMathBox(item.expression, false))
      MathJax.typeset()
    }
  }, [itemID])

  const getExpressionHTML = (expr, setID) => {
    let option = ""
    if (setID) option = "class='id" + expr.id + "'"

    if (expr.type === null) {
      return "<mi mathvariant='normal' " + option + "> &#x2B1A;</mi>"
    }
    else if (expr.type === "constants" || expr.type === "operators") {
      const symbol = symbols[expr.type].find(symbol => symbol.name === expr.name)
      return symbol.getHTML({ expr, option, setID })
    }
    else if (expr.type === "variable_declare") {
      const name = expr.alias ?? expr.name
      return "<mi " + option + ">" + name + "</mi>"
    }
    else if (expr.type === "variable") {
      const alias = expr.ext_deps.find(dep => dep.variable.name === expr.name).variable.alias
      const name = alias ?? expr.name
      return "<mi " + option + ">" + name + "</mi>"
    }
  }

  const createMathBox = (expr, setID = true) => {
    let box = document.createElement("span")
    box.style.width = "40rem"
    box.style["overflow-x"] = "auto"
    box.style["overflow-y"] = "hidden"
    box.style.display = "flex"
    box.style["justify-content"] = "center"

    let math = document.createElement("math")
    math.setAttribute("display", "block")
    math.innerHTML = getExpressionHTML(expr, setID)
    box.appendChild(math)

    return box
  }

  const render_item = (item, id_list) => {
    let output = document.createElement("div")
    output.style["background-color"] = "#212F3C"

    // expandable details
    let details = document.createElement("div")
    details.id = "details:" + item.expression.id

    let isFound = id_list.find(x => x.id === item.expression.id)
    isFound.details_id = details.id
    if (isFound.isExpand) {
      details.style["max-height"] = "none"
      details.style.border = "1px dashed blue"
    }
    else {
      details.style["max-height"] = "0px"
      details.style.border = "none"
    }

    details.style.overflow = "hidden"
    // details.style.transition = "max-height 0.5s ease-out"
    details.style["margin-bottom"] = "5px"
    details.style["margin-left"] = "5px"
    details.style["padding"] = "5px"

    let title = document.createElement("div")
    if (item.proof_type === null) {
      title.innerHTML = "No proof"
    }
    else if (item.proof_type === "Axiom") {
      title.innerHTML = "Axiom"
    }
    else if (item.proof_type === "assumption") {
      title.innerHTML = "Assumption"
    }
    else if (item.proof_type === "starting") {
      title.innerHTML = "Starting expression"
    }
    else if (item.proof_type === "direct") {
      title.innerHTML = "Step: " + item.proof_name
    }
    else if (item.proof_type === "frameworks") {
      title.innerHTML = "Framework: " + item.proof_name
    }

    title.style.display = "flex"
    title.style["justify-content"] = "flex-start"
    details.appendChild(title)

    if (item.proof_type === "direct" || item.proof_type === "frameworks") {
      if (item.proof_name === "Substitution") {
        let title

        if (item.proof_config.whole !== null) {
          title = document.createElement("span")
          title.style.display = "flex"
          title.style["justify-content"] = "flex-start"
          title.innerHTML = "Whole expression: "
          details.appendChild(title)
          details.appendChild(createMathBox(item.proof_config.whole, false))
        }

        if (item.proof_config.target !== null) {
          title = document.createElement("span")
          title.style.display = "flex"
          title.style["justify-content"] = "flex-start"
          title.innerHTML = "Target expression: "
          details.appendChild(title)
          details.appendChild(createMathBox(item.proof_config.target, false))
        }

        let law = null
        if (item.proof_config.law !== null) {
          law = findExpressionByRef(item.proof_config.law)
          if (law === null) {
            alert("Error: cannot find the law by shasum:", item.proof_config.law)
          }
        }

        if (law !== null) {
          title = document.createElement("span")
          title.style.display = "flex"
          title.style["justify-content"] = "flex-start"
          title.innerHTML = "Law: " + item.proof_config.law.slice(0, 8)
          details.appendChild(title)
          details.appendChild(createMathBox(law, false))

          title = document.createElement("span")
          title.style.display = "flex"
          title.style["justify-content"] = "flex-start"
          title.innerHTML = "Law direction: " + item.proof_config.law_direction
          details.appendChild(title)

          for (let dep of law.deps) {
            const sub = item.proof_config.substitution[dep.variable.name]
            if (sub.target !== null) {
              title = document.createElement("span")
              title.style.display = "flex"
              title.style["justify-content"] = "flex-start"
              title.innerHTML = "Expression for " + (dep.variable.alias ?? dep.variable.name) + ": "
              details.appendChild(title)
              details.appendChild(createMathBox(sub.target))
            }

            if (sub.output_set !== null) {
              title = document.createElement("span")
              title.style.display = "flex"
              title.style["justify-content"] = "flex-start"
              title.innerHTML = "Output set for " + (dep.variable.alias ?? dep.variable.name) + ": "
              details.appendChild(title)
              details.appendChild(createMathBox(sub.output_set, false))
            }
          }
        }
      }
      else if (item.proof_name === "Let (for all)") {
        let box = document.createElement("div")
        box.style.display = "flex"
        box.style["justify-content"] = "flex-start"

        let math = document.createElement("math")
        math.setAttribute("display", "block")
        math.innerHTML = ""
        for (let variable_name of item.proof_config.for_all_variables) {
          math.innerHTML += "<mo>&#x2200;</mo>"
          const alias = item.expression.deps.find(dep => dep.variable.name === variable_name).variable.alias
          math.innerHTML += "<mi>" + (alias ?? variable_name) + "</mi>"
        }
        math.innerHTML += "<mo>(</mo>"

        box.appendChild(math)
        details.appendChild(box)
      }
      else if (item.proof_name === "Deduction") {
        let box = document.createElement("div")
        box.style.display = "flex"
        box.style["justify-content"] = "flex-start"
        box.innerHTML = "Direction: " + item.proof_config.direction
        details.appendChild(box)
      }

      // for assumptions
      if (item.assumptions !== undefined) {
        let assumptions = document.createElement("div")
        for (let assumption of item.assumptions) {
          assumptions.appendChild(render_item(assumption, id_list))
        }
        details.appendChild(assumptions)
      }

      // for steps
      if (item.steps !== undefined) {
        let steps = document.createElement("div")
        for (let step of item.steps) {
          steps.appendChild(render_item(step, id_list))
        }
        details.appendChild(steps)
      }

      // for goals
      if (item.goals !== undefined) {
        let goals = document.createElement("div")
        for (let goal of item.goals) {
          goals.appendChild(render_item(goal, id_list))
        }
        details.appendChild(goals)
      }

      if (item.proof_name === "Let (for all)") {
        let box = document.createElement("div")
        box.style.display = "flex"
        box.style["justify-content"] = "flex-start"

        let math = document.createElement("math")
        math.setAttribute("display", "block")
        math.innerHTML = "<mo>)</mo>"

        box.appendChild(math)
        details.appendChild(box)
      }
    }

    let ref = document.createElement("div")
    ref.style.display = "flex"
    ref.style["justify-content"] = "flex-start"
    ref.innerHTML = "Reference: "
    if (item.shasum !== undefined) ref.innerHTML += item.shasum.slice(0, 8)
    details.appendChild(ref)

    output.appendChild(details)

    let statement = document.createElement("div")
    statement.style.display = "flex"
    statement.style["justify-content"] = "space-between"
    statement.appendChild(createMathBox(item.expression))

    let button = document.createElement("button")
    button.id = "button:" + item.expression.id
    isFound.button_id = button.id

    if (isFound.isExpand) button.innerHTML = "-"
    else button.innerHTML = "+"
    statement.appendChild(button)

    output.appendChild(statement)
    return output
  }

  const findExpressionByID_expr = (expr, id) => {
    if (expr.id === id) {
      return { "target": expr }
    }

    if (expr.deps !== undefined) {
      for (let i = 0; i < expr.deps.length; i++) {
        const expr_found1 = findExpressionByID_expr(expr.deps[i].variable, id)
        if (expr_found1 !== null) {
          return expr_found1
        }

        const expr_found2 = findExpressionByID_expr(expr.deps[i].set, id)
        if (expr_found2 !== null) {
          return expr_found2
        }
      }
    }

    if (expr.operands !== undefined) {
      for (let i = 0; i < expr.operands.length; i++) {
        const expr_found = findExpressionByID_expr(expr.operands[i], id)
        if (expr_found !== null) {
          return expr_found
        }
      }
    }

    return null
  }

  const findExpressionByID_item = (item, id) => {
    // find id inside the expression
    const expr_found = findExpressionByID_expr(item.expression, id)
    if (expr_found !== null) {
      expr_found["item"] = item
      expr_found["whole"] = item.expression
      return expr_found
    }

    // for assumptions
    if (item.assumptions !== undefined) {
      for (let assumption of item.assumptions) {
        const output = findExpressionByID_item(assumption, id)
        if (output !== null) {
          return output
        }
      }
    }

    // for steps
    if (item.steps !== undefined) {
      for (let step of item.steps) {
        const output = findExpressionByID_item(step, id)
        if (output !== null) {
          return output
        }
      }
    }

    // for goals
    if (item.goals !== undefined) {
      for (let goal of item.goals) {
        const output = findExpressionByID_item(goal, id)
        if (output !== null) {
          return output
        }
      }
    }

    // for proof_config
    if (item.proof_config !== undefined) {
      if (item.proof_name === "Substitution") {
        for (let name in item.proof_config.substitution) {
          if (item.proof_config.substitution[name].target !== null) {
            const expr_found = findExpressionByID_expr(item.proof_config.substitution[name].target, id)
            if (expr_found !== null) {
              expr_found["item"] = item
              expr_found["whole"] = item.proof_config.substitution[name].target
              return expr_found
            }
          }
        }
      }
    }

    return null
  }

  const findExpressionByID = (book, id) => {
    for (let item of book) {
      const output = findExpressionByID_item(item, id)
      if (output !== null) {
        return output
      }
    }

    return null
  }

  const findExpressionByRef = (ref) => {
    for (let item of book) {
      if (item.shasum === ref) {
        return item.expression
      }
    }

    return null
  }

  const toggleTarget = id => {
    if (id === targetID) {
      setTargetID(null)
    }
    else {
      if (findExpressionByID(book, id) === null) {
        alert("Error: cannot find any expression with the targetID:", id)
      }
      else {
        setTargetID(id)
      }
    }
  }

  const insertExpression = (symbol_type, symbol, isSuper = false) => {
    let clone = structuredClone(book)
    let { whole, target } = findExpressionByID(clone, targetID)

    // reset target if target is not empty
    if (target.type !== null) {
      for (let key in target) {
        if (key !== "id" && key !== "output_set" && key !== "ext_deps")
          delete target[key]
      }
    }

    target.type = symbol_type
    if (symbol_type === "constants" || symbol_type === "operators") {
      target.name = symbol.name
      if (isSuper) target.isSuper = true
      updateDependencies(whole)
      symbol.setTarget({ target, isSuper })
    }
    else if (symbol_type === "variable") {
      target.name = symbol
    }

    updateDependencies(whole)
    setBook(clone)
  }

  const extendExpression = () => {
    let clone = structuredClone(book)
    let { whole, target } = findExpressionByID(clone, targetID)
    symbols[target.type].find(symbol => symbol.name === target.name).extend(target)
    updateDependencies(whole)
    reorder_variable_declare(whole)
    updateDependencies(whole)
    setBook(clone)
  }

  const shrinkExpression = () => {
    let clone = structuredClone(book)
    let { whole, target } = findExpressionByID(clone, targetID)
    symbols[target.type].find(symbol => symbol.name === target.name).shrink(target)
    updateDependencies(whole)
    reorder_variable_declare(whole)
    updateDependencies(whole)
    setBook(clone)
  }

  const updateDependencies = expr => {
    expr.int_deps = []

    // set ext_deps and int_deps for deps
    if (expr.deps !== undefined) {
      for (let dep of expr.deps) {
        dep.set.ext_deps = structuredClone(expr.ext_deps)
        expr.int_deps = expr.int_deps.concat(updateDependencies(dep.set))
      }
    }

    // get all variables in expr.deps
    let variables = []
    if (expr.deps !== undefined) {
      for (let dep of expr.deps) {
        variables.push(structuredClone(dep))
      }
    }

    // set ext_deps and int_deps for operands
    if (expr.operands !== undefined) {
      for (let operand of expr.operands) {
        operand.ext_deps = expr.ext_deps.concat(variables)
        expr.int_deps = expr.int_deps.concat(updateDependencies(operand))
      }
    }

    // delete variable whose variable_declare has been shrunk
    // delete variable whose type is not matched, after the corresponding dep.set has been changed
    if (expr.type === "variable") {
      const declare_dep = expr.ext_deps.find(dep => dep.variable.name === expr.name)
      if (declare_dep === undefined ||
        declare_dep.set.type === null ||
        !isSubset(declare_dep.set.name, expr.output_set)) {
        // reset to empty expression
        for (let key in expr) {
          if (key !== "id" && key !== "output_set" && key !== "ext_deps")
            delete expr[key]
        }
        expr.type = null
        return []
      }
    }

    // get occupied_alias
    if (expr.deps !== undefined) {
      for (let dep of expr.deps) {
        dep.variable.occupied_alias = expr.deps
          .filter(dep_temp => dep_temp.variable.name !== dep.variable.name)
          .map(dep_temp => dep_temp.variable.alias ?? dep_temp.variable.name)

        dep.variable.occupied_alias = dep.variable.occupied_alias
          .concat(expr.ext_deps.map(dep => dep.variable.alias ?? dep.variable.name))

        dep.variable.occupied_alias = dep.variable.occupied_alias
          .concat(expr.int_deps.map(dep => dep.variable.alias ?? dep.variable.name))
      }
    }

    return expr.int_deps.concat(variables)
  }

  const setAlias = alias => {
    let clone = structuredClone(book)
    let { whole, target } = findExpressionByID(clone, targetID)

    if (alias !== target.name) {
      target.alias = alias
    }
    else if (target.alias !== undefined) {
      delete target.alias
    }

    updateDependencies(whole)
    setBook(clone)
  }

  const reorder_variable_declare = expr => {
    if (expr.deps !== undefined) {
      for (let i = 0; i < expr.deps.length; i++) {
        expr.deps[i].variable.name = String.fromCharCode(97 + expr.ext_deps.length + i)
        reorder_variable_declare(expr.deps[i].set)
      }
    }

    if (expr.operands !== undefined) {
      for (let operand of expr.operands) {
        reorder_variable_declare(operand)
      }
    }

    if (expr.type === "variable") {
      const index = expr.ext_deps.findIndex(dep => dep.variable.name === expr.name)
      expr.name = String.fromCharCode(97 + index)
    }
  }

  const contain_big_notation = expr => {
    if (expr.type === "operators") {
      if (expr.name === "add" && expr.isSuper !== undefined) return true
    }

    if (expr.deps !== undefined) {
      for (let dep of expr.deps) {
        const isContain = contain_big_notation(dep.set)
        if (isContain) return isContain
      }
    }

    if (expr.operands !== undefined) {
      for (let operand of expr.operands) {
        const isContain = contain_big_notation(operand)
        if (isContain) return isContain
      }
    }

    return false
  }

  const expr_to_json = (expr, setAlias) => {
    let output = {}
    output.type = expr.type
    if (expr.type === null) {
    }
    else if (expr.type === "constants" || expr.type === "operators") {
      output.name = expr.name
      if (expr.isSuper !== undefined) output.isSuper = true

      if (expr.deps !== undefined) {
        output.deps = []
        for (let dep of expr.deps) {
          output.deps.push({
            variable: expr_to_json(dep.variable, setAlias),
            set: expr_to_json(dep.set, setAlias)
          })
        }
      }

      if (expr.operands !== undefined) {
        output.operands = []
        for (let operand of expr.operands) {
          output.operands.push(expr_to_json(operand, setAlias))
        }
      }
    }
    else if (expr.type === "variable_declare") {
      output.name = expr.name
      if (setAlias && expr.alias !== undefined) output.alias = expr.alias
    }
    else if (expr.type === "variable") {
      output.name = expr.name
    }

    return output
  }

  const expr_from_json = (expr, id) => {
    // set id
    expr.id = id
    id += 1

    if (expr.deps !== undefined) {
      for (let dep of expr.deps) {
        id = expr_from_json(dep.variable, id)
        id = expr_from_json(dep.set, id)
      }
    }

    if (expr.operands !== undefined) {
      for (let operand of expr.operands) {
        id = expr_from_json(operand, id)
      }
    }

    // set output_set
    if (expr.type === "operators") {
      const symbol = symbols[expr.type].find(symbol => symbol.name === expr.name)
      symbol.set_output_sets(expr)
    }

    return id
  }

  const updateHash = (item) => {
    item.shasum = shasum(JSON.stringify(expr_to_json(item.expression, false))).toString()

    // for assumptions
    if (item.assumptions !== undefined) {
      for (let assumption of item.assumptions) {
        updateHash(assumption)
      }
    }

    // for steps
    if (item.steps !== undefined) {
      for (let step of item.steps) {
        updateHash(step)
      }
    }

    // for goals
    if (item.goals !== undefined) {
      for (let goal of item.goals) {
        updateHash(goal)
      }
    }
  }

  const item_to_json = (item, setShasum = false) => {
    let output = {}
    if (setShasum) output.shasum = item.shasum
    output.expression = expr_to_json(item.expression, true)
    if (item.expression.ext_deps.length !== 0) output.expression.ext_deps = copy_ext_deps(item.expression.ext_deps)

    output.proof_type = item.proof_type
    if (item.proof_type !== null &&
      item.proof_type !== "Axiom") {
      output.proof_name = item.proof_name
      output.proof_config = structuredClone(item.proof_config)

      // for assumptions
      if (item.assumptions !== undefined) {
        output.assumptions = []
        for (let assumption of item.assumptions) {
          output.assumptions.push(item_to_json(assumption))
        }
      }

      // for steps
      if (item.steps !== undefined) {
        output.steps = []
        for (let step of item.steps) {
          output.steps.push(item_to_json(step))
        }
      }

      // for goals
      if (item.goals !== undefined) {
        output.goals = []
        for (let goal of item.goals) {
          output.goals.push(item_to_json(goal))
        }
      }
    }

    return output
  }

  const save = () => {
    let clone = structuredClone(book)
    for (let item of clone) {
      updateHash(item)
    }
    setBook(clone)

    let output_json = []
    for (let item of clone) {
      output_json.push(item_to_json(item, true))
    }
    console.log("json output", output_json)
  }

  const isSubset = (small, large) => {
    if (small === large) return true
    if (large === "universal_set") return true
    return false
  }

  const isIn = (element, set) => {
    if (set === "universal_set") return true
    for (let small of element.belongs) {
      if (isSubset(small, set)) return true
    }
    return false
  }

  const copy_ext_deps = ext_deps => {
    let output = []
    for (let dep of ext_deps) {
      let dep_new = {}
      dep_new.variable = {}
      dep_new.variable.name = dep.variable.name
      if (dep.variable.alias !== undefined) dep_new.variable.alias = dep.variable.alias

      dep_new.set = expr_to_json(dep.set, true)
      output.push(dep_new)
    }
    return output
  }

  const is_exactly_same = (expr1, expr2) => {
    return true
  }

  const find_substitution = (law, target, subs) => {
    if (law.type === null) {
      return "law tpye is null"
    }
    else if (law.type === "variable") {
      const dep = subs.find(sub => sub.variable.name === law.name)
      if (dep === undefined) return "law variable did not be declared: " + law.name

      if (dep.variable.target_expr === undefined) {
        dep.variable.target_expr = structuredClone(target)
      }
      else {
        if (is_exactly_same(dep.variable.target_expr, target) !== true)
          return is_exactly_same
      }
    }
    else if (law.type === "variable_declare") {
      if (target.type !== law.type)
        return "law type: " + law.type + ", target type: " + target.type

      const dep = subs.find(sub => sub.variable.name === law.name)
      if (dep === undefined) {
        let dep_new = { variable: { name: law.name, target_expr: { type: "variable", name: target.name } } }
        if (target.alias !== undefined) dep_new.variable.target_expr.alias = target.alias
        subs.push(dep_new)
      }
      else {
        if (target.name !== law.name)
          return "law variable_declare name: " + law.name + ", target variable_declare name: " + target.name
      }
    }
    else if (law.type === "constants" || law.type === "operators") {
      if (target.type !== law.type)
        return "law type: " + law.type + ", target type: " + target.type

      if (target.name !== law.name)
        return "law name: " + law.name + ", target name: " + target.name

      if (target.isSuper !== law.isSuper) {
        let output = ""
        output += "law isSuper: "
        if (law.isSuper === undefined) output += "undefined"
        else output += law.isSuper.toString()
        output += ", target isSuper: "
        if (target.isSuper === undefined) output += "undefined"
        else output += target.isSuper.toString()
        return output
      }

      const law_has_deps = law.deps !== undefined
      const target_has_deps = target.deps !== undefined
      if (target_has_deps !== law_has_deps)
        return "law_has_deps: " + law_has_deps.toString() + ", target_has_deps: " + target_has_deps.toString()

      if (law_has_deps) {
        if (target.deps.length !== law.deps.length)
          return "law.deps.length: " + law.deps.length + ", target.deps.length: " + target.deps.length

        for (let i = 0; i < law.deps.length; i++) {
          const result_variable = find_substitution(law.deps[i].variable, target.deps[i].variable, subs)
          if (result_variable !== true) return result_variable

          const result_set = find_substitution(law.deps[i].set, target.deps[i].set, subs)
          if (result_set !== true) return result_set
        }
      }

      const law_has_operands = law.operands !== undefined
      const target_has_operands = target.operands !== undefined
      if (target_has_operands !== law_has_operands)
        return "law_has_operands: " + law_has_operands.toString() + ", target_has_operands: " + target_has_operands.toString()

      if (law_has_operands) {
        if (target.operands.length !== law.operands.length)
          return "law.operands.length: " + law.operands.length + ", target.operands.length: " + target.operands.length

        for (let i = 0; i < law.operands.length; i++) {
          const result = find_substitution(law.operands[i], target.operands[i], subs)
          if (result !== true) return result
        }
      }
    }

    return true
  }

  const do_substitution = (law, subs) => {
    if (law.type === null) {
      alert("do_substitution: the type is null")
    }
    else if (law.type === "variable" || law.type === "variable_declare") {
      const dep = subs.find(sub => sub.variable.name === law.name)
      if (dep === undefined) {
        alert("do_substitution: cannot find the corresponding variable in subs: " + law.name)
      }

      if (dep.variable.target_expr === undefined) {
        alert("do_substitution: target_expr is undefined.")
      }

      if (law.type === "variable") {
        let target_expr = expr_to_json(dep.variable.target_expr)

        for (let key in law) {
          delete law[key]
        }

        for (let key in target_expr) {
          law[key] = target_expr[key]
        }
      }
      else if (law.type === "variable_declare") {
        law.name = target_expr.name
        if (target_expr.alias !== undefined) law.alias = target_expr.alias
      }
    }
    else if (law.type === "constants" || law.type === "operators") {
      if (law.deps !== undefined) {
        for (let dep of law.deps) {
          do_substitution(dep.variable, subs)
          do_substitution(dep.set, subs)
        }
      }

      if (law.operands !== undefined) {
        for (let operand of law.operands) {
          do_substitution(operand, subs)
        }
      }
    }
  }

  const proof_methods = {}
  proof_methods.direct = []
  proof_methods.direct.push({
    name: "Substitution",
    update: (item, id) => {
      if (item.proof_config.law === null) return
      const law = findExpressionByRef(item.proof_config.law)

      // find substitution from target
      let subs
      let isFoundFullSubstitution = false
      if (item.proof_config.target !== null) {
        subs = structuredClone(law.deps)
        let result
        if (item.proof_config.law_direction === "Left to Right") {
          result = find_substitution(law.operands[0].operands[0], item.proof_config.target, subs)
        }
        else if (item.proof_config.law_direction === "Right to Left") {
          result = find_substitution(law.operands[0].operands[1], item.proof_config.target, subs)
        }

        if (result !== true) {
          alert("Substitution is impossible to produce the target. Error: " + result)
          return id
        }

        if (subs.find(dep => dep.variable.target_expr === undefined) === undefined) {
          isFoundFullSubstitution = true
        }
      }

      if (isFoundFullSubstitution) {
        let output = expr_to_json(law.operands[0], false)

        // swap two operands
        if (item.proof_config.law_direction === "Right to Left") {
          const temp = output.operands[0]
          output.operands[0] = output.operands[1]
          output.operands[1] = temp
        }
        do_substitution(output, subs)

        let whole_changed = structuredClone(item.proof_config.whole)
        let target_changed = findExpressionByID_expr(whole_changed, item.proof_config.target.id).target
        for (let key in target_changed) {
          delete target_changed[key]
        }

        for (let key in output.operands[1]) {
          target_changed[key] = output.operands[1][key]
        }

        const old_id = item.expression.id

        item.expression = {
          "type": "operators",
          "name": output.name,
          "operands": [expr_to_json(item.proof_config.whole), expr_to_json(whole_changed)]
        }

        item.expression.output_set = "boolean"
        id = expr_from_json(item.expression, id)
        item.expression.ext_deps = item.proof_config.whole.ext_deps
        updateDependencies(item.expression)

        item.expression.id = old_id
      }

      return id
    },
  })

  proof_methods.frameworks = []
  proof_methods.frameworks.push({
    name: "Let (for all)",
    remove_variable: (proof_config, variable_name) => {
      const index = proof_config.for_all_variables.indexOf(variable_name)
      proof_config.for_all_variables.splice(index, 1)
    },
    add_variable: (proof_config, variable_name) => {
      proof_config.for_all_variables.push(variable_name)
      proof_config.for_all_variables.sort()
    },
    update: (item, id) => {
      const ext_deps = item.expression.deps
        .filter(dep => item.proof_config.for_all_variables
          .find(variable_name => variable_name === dep.variable.name) !== undefined)

      // set assumptions
      item.assumptions = ext_deps.map(dep => {
        let expr = {}
        expr.type = "operators"
        expr.name = "in"

        expr.operands = []
        expr.operands.push({
          type: "variable",
          name: dep.variable.name
        })
        expr.operands.push((expr_to_json(dep.set, true)))

        let item_new = { expression: expr, proof_type: "assumption" }
        id = item_from_json(item_new, id, copy_ext_deps(item.expression.ext_deps.concat(ext_deps)))
        return item_new
      })

      // set goals
      let expression = null
      if (item.proof_config.for_all_variables.length === item.expression.deps.length) {
        expression = expr_to_json(item.expression.operands[0], true)
      }
      else {
        expression = expr_to_json(item.expression, true)
        expression.deps = expression.deps
          .filter(dep => item.proof_config.for_all_variables
            .find(variable_name => variable_name === dep.variable.name) === undefined)
      }

      item.goals = []
      item.goals.push({ expression, proof_type: null })
      id = item_from_json(item.goals[0], id, copy_ext_deps(item.expression.ext_deps.concat(ext_deps)))

      return id
    }
  })

  proof_methods.frameworks.push({
    name: "Deduction",
    update: (item, id) => {
      // reset steps
      item.steps = []

      // set starting expression
      let operand_index = null
      if (item.proof_config.direction == "Left to Right") operand_index = 0
      else if (item.proof_config.direction == "Right to Left") operand_index = 1

      let expr = expr_to_json(item.expression.operands[operand_index], true)
      let item_new = { expression: expr, proof_type: "starting" }
      id = item_from_json(item_new, id, copy_ext_deps(item.expression.ext_deps))

      item.assumptions = []
      item.assumptions.push(item_new)
      return id
    }
  })

  proof_methods.frameworks.push({
    name: "Backward",
  })

  proof_methods.frameworks.push({
    name: "Contradiction",
  })

  proof_methods.frameworks.push({
    name: "Induction",
  })

  proof_methods.frameworks.push({
    name: "Cases",
  })

  const set_proof_method = (proof_type, proof_method) => {
    let clone = structuredClone(book)
    const { item } = findExpressionByID(clone, itemID)

    if (item.proof_type !== null) {
      alert("The proof type has been set.")
      return
    }

    // reset proof method
    for (let key in item) {
      if (key !== "shasum" && key !== "expression")
        delete item[key]
    }

    // set proof method
    if (proof_type === "Axiom") {
      item.proof_type = "Axiom"
    }
    else if (proof_type === "direct") {
      if (proof_method.name === "Substitution") {
        item.proof_config = {}
        item.proof_config.whole = null
        item.proof_config.target = null
        item.proof_config.law = null
        item.proof_config.law_direction = null
        item.proof_config.substitution = {}
      }

      item.proof_type = proof_type
      item.proof_name = proof_method.name
    }
    else if (proof_type === "frameworks") {
      if (proof_method.name === "Let (for all)") {
        if (item.expression.type === "operators" &&
          item.expression.name === "and" &&
          item.expression.isSuper !== undefined) {
          item.proof_config = {}
          item.proof_config.for_all_variables = item.expression.deps.map(dep => dep.variable.name)
          const id = proof_method.update(item, newID)
          setNewID(id)
        }
        else {
          alert("Let (for all) cannot be used. The operator is not (for all).")
          return
        }
      }
      else if (proof_method.name === "Deduction") {
        const allowed_operators = ["equal", "iff", "implies"]
        if (item.expression.type === "operators" &&
          allowed_operators.find(name => name === item.expression.name)) {
          item.proof_config = {}
          item.proof_config.direction = "Left to Right"

          const id = proof_method.update(item, newID)
          setNewID(id)
        }
        else {
          alert("Deduction cannot be used. The operator is not allowed.")
          return
        }
      }

      item.proof_type = proof_type
      item.proof_name = proof_method.name
    }

    setBook(clone)
  }

  const flex_start = { display: "flex", "justifyContent": "flex-start" }
  return (
    <div>
      <div id="math-root">
      </div>
      <div style={flex_start}>
        General:
        {(() => {
          let output = []
          output.push(
            <button key="Save"
              onClick={() => { save() }}>
              Save
            </button>)

          output.push(
            <button key="Add item"
              onClick={() => { addItem() }}>
              Add item
            </button>)

          if (targetID === null) {
          }
          else {
            const { target } = findExpressionByID(book, targetID)
            if (target.type === null) {
            }
            else if (target.type === "operators") {
              const symbol = symbols[target.type].find(symbol => symbol.name === target.name)
              output.push(
                <button key="extend"
                  disabled={!(symbol.extensible && symbol.extend_condition(target))}
                  onClick={() => { extendExpression() }}>
                  Extend
                </button>)

              output.push(
                <button key="shrink"
                  disabled={!(symbol.extensible && symbol.shrink_condition(target))}
                  onClick={() => { shrinkExpression() }}>
                  Shrink
                </button>)
            }
          }
          return output
        })()}
      </div>
      <div style={flex_start}>
        Constants:
        {(() => {
          if (targetID === null) return []
          const { target } = findExpressionByID(book, targetID)
          if (target.type === "variable_declare") return []

          return symbols.constants
            .filter(constant => isIn(constant, target.output_set))
            .map((constant) =>
              <button key={constant.name} onClick={() => { insertExpression("constants", constant) }}>
                <math> {constant.button_mml} </math>
              </button>)
        })()}
      </div>
      <div style={flex_start}>
        Variables:
        {(() => {
          if (targetID === null) return []
          const { target } = findExpressionByID(book, targetID)
          if (target.type === "variable_declare") return []

          let output = []
          for (let dep of target.ext_deps) {
            if (dep.set.type === null) continue
            if (!isSubset(dep.set.name, target.output_set)) continue
            output.push(
              <button key={dep.variable.name} onClick={() => { insertExpression("variable", dep.variable.name) }}>
                {dep.variable.alias ?? dep.variable.name}
              </button>)
          }
          return output
        })()}
      </div>
      <div style={flex_start}>
        Operators:
        {(() => {
          if (targetID === null) return []
          const { target } = findExpressionByID(book, targetID)
          if (target.type === "variable_declare") return []

          return symbols.operators
            .filter(operator => isSubset(operator.output_set, target.output_set))
            .map(operator => {
              let output = []
              output.push(
                <button key={operator.name} onClick={() => { insertExpression("operators", operator) }}>
                  <math> {operator.button_mml} </math>
                </button>)
              if (operator.extensible) {
                output.push(
                  <button key={operator.name + "_super"} onClick={() => { insertExpression("operators", operator, true) }}>
                    <math> {operator.button_mml_super} </math>
                  </button>)
              }
              return output
            })
        })()}
      </div>
      <div style={flex_start}>
        Variable alias:
        {(() => {
          if (targetID === null) return []
          const { target } = findExpressionByID(book, targetID)
          if (target.type !== "variable_declare") return []
          return " " + target.name + "\u2192" + (target.alias ?? target.name)
        })()}
      </div>
      <div style={flex_start}>
        {(() => {
          if (targetID === null) return []
          const { target } = findExpressionByID(book, targetID)
          if (target.type !== "variable_declare") return []

          let output = []
          for (let i = 97; i <= 122; i++) {
            const alias_name = String.fromCharCode(i)
            if (target.occupied_alias.find(name => name === alias_name)) continue
            output.push(
              <button key={alias_name} onClick={() => { setAlias(alias_name) }}>
                {alias_name}
              </button>)
          }
          return output
        })()}
      </div>
      <div style={flex_start}>
        Selected active item:
        {(() => {
          if (targetID === null) {
            return (
              <button onClick={() => { setItemID(null) }}>
                Select root
              </button>
            )
          }
          else {
            const { item } = findExpressionByID(book, targetID)
            return (
              <button onClick={() => { setItemID(item.expression.id) }}>
                Select item
              </button>
            )
          }
        })()}
      </div>
      <div id="active-item">
      </div>
      <div style={flex_start}>
        {(() => {
          if (itemID === null) return []
          let output = []
          output.push(<span key="title">Direct proof methods:</span>)
          output.push(
            <button key="Axiom" onClick={() => { set_proof_method("Axiom", null) }}>
              Axiom
            </button>)

          return output.concat(proof_methods.direct
            .map(proof_method => (
              <button key={proof_method.name} onClick={() => { set_proof_method("direct", proof_method) }}>
                {proof_method.name}
              </button>
            )))
        })()}
      </div>
      <div style={flex_start}>
        {(() => {
          if (itemID === null) return []
          let output = []
          output.push(<span key="title">Proof frameworks:</span>)
          return output.concat(proof_methods.frameworks
            .map(proof_method => (
              <button key={proof_method.name} onClick={() => { set_proof_method("frameworks", proof_method) }}>
                {proof_method.name}
              </button>
            )))
        })()}
      </div>
      <div>
        {(() => {
          if (itemID === null) return []
          let clone = structuredClone(book)
          const { item } = findExpressionByID(clone, itemID)
          let output = []
          if (item.proof_type !== null && item.proof_type !== "Axiom") {
            output.push(<div key="title" style={flex_start}> {"Selected method: " + item.proof_name} </div>)
            const proof_method = proof_methods[item.proof_type].find(method => method.name === item.proof_name)
            if (item.proof_name === "Substitution") {
              if (targetID === null) return []
              const { item: item_sub, whole, target } = findExpressionByID(clone, targetID)

              // law config
              let law_config = []
              law_config.push(
                <button key="Set law" onClick={() => {
                  if (whole.type === "operators" &&
                    whole.name === "and" &&
                    whole.isSuper !== undefined) {
                    item.proof_config.law = item_sub.shasum
                    item.proof_config.law_direction = "Left to Right"
                    for (let dep of whole.deps) {
                      item.proof_config.substitution[dep.variable.name] = {
                        target: null,
                        output_set: null
                      }
                    }

                    const id = proof_method.update(item, newID)
                    setBook(clone)
                    setNewID(id)
                  }
                  else {
                    alert("The law is not (for all) statement.")
                  }
                }}>
                  Set Law
                </button>)

              if (item.proof_config.law !== null) {
                const law = findExpressionByRef(item.proof_config.law)
                law_config.push(
                  <button key="Left to Right" onClick={() => {
                    const allowed_operators = ["equal", "iff", "implies"]
                    if (law.operands[0].type === "operators" &&
                      allowed_operators.find(name => name === law.operands[0].name)) {
                      item.proof_config.law_direction = "Left to Right"
                      const id = proof_method.update(item, newID)
                      setBook(clone)
                      setNewID(id)
                    }
                    else {
                      alert("Left to Right cannot be used. The operator is not allowed.")
                    }
                  }}>
                    Left to Right
                  </button>)

                law_config.push(
                  <button key="Right to Left" onClick={() => {
                    const allowed_operators = ["equal", "iff"]
                    if (law.operands[0].type === "operators" &&
                      allowed_operators.find(name => name === law.operands[0].name)) {
                      item.proof_config.law_direction = "Right to Left"
                      const id = proof_method.update(item, newID)
                      setBook(clone)
                      setNewID(id)
                    }
                    else {
                      alert("Right to Left cannot be used. The operator is not allowed.")
                    }
                  }}>
                    Right to Left
                  </button>)
              }

              output.push(
                <div key="law_config" style={flex_start}>
                  Law config: {law_config}
                </div>)

              // subject config
              let buttons = []
              buttons.push(
                <button key="Set whole" onClick={() => {
                  item.proof_config.whole = target
                  const id = proof_method.update(item, newID)
                  setBook(clone)
                  setNewID(id)
                }}>
                  Set whole expression
                </button>)

              buttons.push(
                <button key="Set target" onClick={() => {
                  item.proof_config.target = target
                  if (item.proof_config.whole === null) item.proof_config.whole = target
                  const id = proof_method.update(item, newID)
                  setBook(clone)
                  setNewID(id)
                }}>
                  Set target expression
                </button>)

              output.push(
                <div key="Subject config" style={flex_start}>
                  Subject config: {buttons}
                </div>)

              // Substitution
              if (item.proof_config.law !== null) {
                const law = findExpressionByRef(item.proof_config.law)
                let substitution = law.deps.map(dep => (
                  <div key={dep.variable.name} style={flex_start}>
                    {"Substitution for " + (dep.variable.alias ?? dep.variable.name) + ": "}
                    <button key="Set expression" onClick={() => {
                      const copy = expr_to_json(target, true)

                      copy.output_set = target.output_set
                      let id = expr_from_json(copy, newID)
                      copy.ext_deps = target.ext_deps
                      updateDependencies(copy)

                      item.proof_config.substitution[dep.variable.name].target = copy
                      id = proof_method.update(item, newID)
                      setBook(clone)
                      setNewID(id)
                    }}>
                      expression
                    </button>
                    <button key="output set" onClick={() => {
                      item.proof_config.substitution[dep.variable.name].output_set = whole
                      const id = proof_method.update(item, newID)
                      setBook(clone)
                      setNewID(id)
                    }}>
                      output set
                    </button>
                  </div>)
                )

                output.push(substitution)
              }
            }
            else if (item.proof_name === "Let (for all)") {
              let for_all_variables_buttons = item.expression.deps.map(dep => {
                if (item.proof_config.for_all_variables.find(variable_name => variable_name === dep.variable.name)) {
                  return (
                    <button key={dep.variable.name} onClick={() => {
                      proof_method.remove_variable(item.proof_config, dep.variable.name)
                      const id = proof_method.update(item, newID)
                      setBook(clone)
                      setNewID(id)
                    }}>
                      {"Remove " + dep.variable.name}
                    </button>)
                }
                else {
                  return (
                    <button key={dep.variable.name} onClick={() => {
                      proof_method.add_variable(item.proof_config, dep.variable.name)
                      const id = proof_method.update(item, newID)
                      setBook(clone)
                      setNewID(id)
                    }}>
                      {"Add " + dep.variable.name}
                    </button>)
                }
              })
              output.push(
                <div key="for_all_variables" style={flex_start}>
                  Add/Remove variables: {for_all_variables_buttons}
                </div>)
            }
            else if (item.proof_name === "Deduction") {
              let buttons = []
              buttons.push(
                <button key="Left to Right" onClick={() => {
                  const allowed_operators = ["equal", "iff", "implies"]
                  if (item.expression.type === "operators" &&
                    allowed_operators.find(name => name === item.expression.name)) {
                    item.proof_config.direction = "Left to Right"

                    const id = proof_method.update(item, newID)
                    setBook(clone)
                    setNewID(id)
                  }
                  else {
                    alert("Left to Right cannot be used. The operator is not allowed.")
                  }
                }}>
                  Left to Right
                </button>)

              buttons.push(
                <button key="Right to Left" onClick={() => {
                  const allowed_operators = ["equal", "iff"]
                  if (item.expression.type === "operators" &&
                    allowed_operators.find(name => name === item.expression.name)) {
                    item.proof_config.direction = "Right to Left"

                    const id = proof_method.update(item, newID)
                    setBook(clone)
                    setNewID(id)
                  }
                  else {
                    alert("Right to Left cannot be used. The operator is not allowed.")
                  }
                }}>
                  Right to Left
                </button>)

              output.push(
                <div key="direction" style={flex_start}>
                  Direction: {buttons}
                </div>)
            }
          }

          return output
        })()}
      </div>
    </div>
  )
}

export default App;
