import { CStack } from './CStack';
import { BNodeKind, BNode } from './Node';
import { FuncName } from "./Func";
import { Token, TokenType } from './Token'

export default class Parser {
  vars: number[] = [];
  currentLine: string = '';
  currentPointer: number = 0;
  cstack = new CStack();
  token = new Token();

  constructor(){}

  parse(input: string) {
    this.currentLine = input;
    this.currentPointer = 0;

    try {
      this.nextToken();
      console.clear();
      let result = this.expr();
      console.log(result);
      console.log(result.toString());
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }

  expr(): BNode {
    let node: BNode;
    // this.nextToken();
    if(this.consumeToken(TokenType.SUB)){
      node = new BNode(BNodeKind.SUB, this.mult(), BNode.zero);
    }
    else {
      this.consumeToken(TokenType.ADD);
      node = this.mult();
    }
    for(;;){
      if(this.consumeToken(TokenType.ADD)){
        node = new BNode(BNodeKind.ADD, this.mult(), node);
      }
      else if(this.consumeToken(TokenType.SUB)){
        node = new BNode(BNodeKind.SUB, this.mult(), node);
      }
      else {
        return node;
      }
    }
  }

  mult(): BNode {
    let node = this.powr();

    for(;;){
      if(this.consumeToken(TokenType.MUL)){
        node = new BNode(BNodeKind.MUL, this.powr(), node);
      } else if(this.consumeToken(TokenType.DIV)){
        node = new BNode(BNodeKind.DIV, this.powr(), node);
      } else if(!this.checkTokens(TokenType.ADD, TokenType.SUB, TokenType.CMA, TokenType.RPT) && !this.checkToken(TokenType.EOL)){
        node = new BNode(BNodeKind.MUL, this.powr(), node);
      } else {
        return node;
      }
    }
  }

  powr(): BNode {
    let node = this.prim();

    if(this.consumeToken(TokenType.POW)){
      return new BNode(BNodeKind.POW, node, this.powr());
    }

    return node;
  }

  prim(): BNode {
    let node: BNode;
    let fn: FuncName;
    if(this.consumeToken(TokenType.LPT)){
      node = this.expr();
      this.expectToken(TokenType.RPT);
      return node;
    }
    else if(fn = this.consumeFunc()){
      return this.func(fn);
    }
    // else if(fn = this.consumeVar()){
    //   return this.vari(fn);
    // }
    return this.nmbr(this.expectNumber());
  }
/*
Node* func(int id)
{
	Node* node;


	if (consume("(")) {
		node = expr();
		while (consume(",")) {
			node = new_node_func(id, node, expr());
		}
		expect(")");
		return node->kind == ND_FNC ? node : new_node_func(id, node, NULL);
	}
	return new_node_func(id, mult(), NULL);
}
*/
  func(fn: FuncName): BNode {
    let node : BNode;

    if(this.consumeToken(TokenType.LPT)){
      node = this.expr();
      while(this.consumeToken(TokenType.CMA)){
        node = new BNode(BNodeKind.FNC, node, this.expr(), FuncName.NIL);
      }
      this.expectToken(TokenType.RPT);
      return node.kind === BNodeKind.FNC ? node : new BNode(BNodeKind.FNC, node, null, fn);
    }
    return new BNode(BNodeKind.FNC, this.mult(), null, fn);
  }

  vari(): BNode {
    return new BNode();
  }

  nmbr(x: number): BNode {
    return new BNode(BNodeKind.NUM, null, null, x);
  }

  character(): string {
    let character = this.currentLine[this.currentPointer];
    if (/\s/.test(character)) {
      return this.nextCharacter();
    }
    return character;
  }

  nextCharacter(): string {
    let character = this.currentLine[++this.currentPointer];
    if (/\s/.test(character)) {
      return this.nextCharacter();
    }
    return character;
  }

  nextToken() {
    (async s=> await (s_=>new Promise( resolve => setTimeout(resolve, 1000*s_) ))(s))( 0.5 );
    let character = this.character();
    let str = this.currentLine.slice(this.currentPointer);
    let fn: FuncName;
    this.token = new Token(TokenType.UNK, 0, character);

    if (character === undefined) {
      this.token = Token.eol;
      return;
    }

    if (this.isNumber(character)) {
      let numberText = '';
      while (this.isNumber(character)) {
        numberText += character;
        character = this.nextCharacter();
      }
      this.token.type = TokenType.NUM;
      this.token.value = parseInt(numberText, 10);
      return;
    }

    if (fn = this.isFunction(str)) {
      this.token.type = TokenType.FNC;
      this.token.value = fn;
      for(let i=0; i<fn.length; i++) this.nextCharacter();
      return;
    }

    if (this.isVariable(character)) {
      this.token.type = TokenType.VAR;
      this.token.value = character.charCodeAt(0) - 'a'.charCodeAt(0);
      this.nextCharacter();
      return;
    }

    switch (character) {
      case '+':
        this.token.type = TokenType.ADD;
        break;
      case '-':
        this.token.type = TokenType.SUB;
        break;
      case '*':
        this.token.type = TokenType.MUL;
        break;
      case '/':
        this.token.type = TokenType.DIV;
        break;
      case '^':
        this.token.type = TokenType.POW;
        break;
      case '=':
        this.token.type = TokenType.EQL;
        break;
      case ',':
        this.token.type = TokenType.CMA;
        break;
      case '(':
        this.token.type = TokenType.LPT;
        break;
      case ')':
        this.token.type = TokenType.RPT;
        break;
      default:
        this.token.type = TokenType.UNK;
    }

    this.nextCharacter();
    return;
  }
/*
void expect(char* op)
{
	if (token->kind != TK_RESERVED || strncmp(token->str, op, strlen(op)) != 0)
		error("'%s'ではありません", op);
	token = token->next;
}
*/
  expectToken(type: TokenType) {
    if(this.token.type != type){
      console.error(`Unexpected token error. Expected TokenType: ${type}, but caught following token`, this.token);
    }
    this.nextToken();
  }

  consumeToken(type: TokenType) {
    if(this.token && this.token.type != type){
      return false;
    }
    this.nextToken();
    return true;
  }

  checkToken(type: TokenType) {
    if(this.token && this.token.type != type){
      return false;
    }
    return true;
  }

  checkTokens(...types: TokenType[]) {
    if(this.token && 0 > types.indexOf(this.token.type)){
      return false;
    }
    return true;
  }

  consumeFunc(): FuncName {
    if(this.token.type != TokenType.FNC)return FuncName.NIL;
    let fn = this.token.value as FuncName;
    this.nextToken();
    return fn;
  }

  expectNumber(): number {
    if(this.token.type != TokenType.NUM){
      console.error(`Unexpected token error. Expected TokenType: NUM, but caught following token`, this.token);
    }
    let val = this.token.value;
    this.nextToken();
    return val as number;
  }

  isNumber(text: string): boolean {
    return /\d+/.test(text);
  }

  isVariable(text: string): boolean {
    return /[a-z]+/.test(text);
  }

  isFunction(text: string): FuncName {
    let fns = Object.values(FuncName);
    let fn: FuncName;
    for(let i=0; i<fns.length; i++){
      fn = fns[i];
      if(fn && (new RegExp(`^${fn}`)).test(text)){
        return fn;
      }
    }
    return FuncName.NIL;
  }

  setVar(index: number, value: number) {
    this.vars[index] = value;
  }
}