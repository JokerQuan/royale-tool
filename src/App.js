import React, { Component } from 'react';
import { Layout, Menu, Button, Select, Typography, Row, Col, Card, Modal, Input, Pagination } from 'antd';
import html2canvas from "html2canvas";

import Ajax from "./api/ajax";
import './App.css';
import cardsType from "./cards.json";

const { Header, Content } = Layout;
const { Option } = Select;
const { Text } = Typography;

class App extends Component {

  constructor() {
    super();
    this.deckRef = React.createRef();
    this.cardsRef = React.createRef();
  }

  state = {
    time : "1d",
    sort : "pop",
    type : "TopLadder",
    decks : [],
    decksLoding : true,
    deckModalShow : false,
    selectedDeck : {},
    bgColor : "transparent",
    textColor : "#000000",
    topVisible : true,
    cardsVisible : false,
    cardTime : "7d",
    cardBattleType : "GC",
    cardType : "spells",
    cardTypeName : "法术",
    cardsLoading : true,
    cards : [],
    selectedCards : [],
    page : 1,
    pageCards : [],
    cardsBgColor : "transparent"
  }

  handleUpdate = async () => {
    this.setState({
      decksLoding : true
    });
    const {time, sort, type} = this.state;
    const resp = await Ajax.get('/home', {time, sort, type});
    this.setState({
      decks : resp.data,
      decksLoding : false
    });
  }

  getCards = async () => {
    this.setState({
      cardsLoding : true
    });
    const {cardTime, cardBattleType} = this.state;
    const resp = await Ajax.get('/cards', {cardTime, cardBattleType});

    const cards = cardsType.map(cardType => {
      return resp.data.find(card => {
        if(cardType.name === card.name){
          card.type = cardType.type;
          return card;
        }
      });
    }).sort((a, b) => {
      return b.usagePercent - a.usagePercent;
    });

    const selectedCards = cards.filter(card => {
      if(card.type.indexOf(this.state.cardType) > -1){
        return true;
      }
    });

    let pageCards = selectedCards.slice(0, 25);

    this.setState({
      cards,
      cardsLoading : false,
      selectedCards,
      pageCards
    });
  }

  getLocalSrc = url => {
    const imgSrc = url.split("/cards-150/")[1];
    return imgSrc;
  }

  handleExportImg = (type) => {
    const {selectedDeck, bgColor} = this.state;
    let exportNode, exportName;
    switch(type){
      case "deck":
        exportNode = this.deckRef.current;
        exportName = selectedDeck.name;
        break;
      case "cards":
        exportNode = this.cardsRef.current;
        exportName = "spells";
        break;
    }
    const options = {
      scale : 2,
      backgroundColor : bgColor === "transparent" ? null : bgColor,
      scrollY : 0
    };
    html2canvas(exportNode, options).then(canvas => {
      const imgUri = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"); // 获取生成的图片的url 　
      const saveLink = document.createElement('a');
      saveLink.href = imgUri;
      saveLink.download = `${exportName}.png`;
      saveLink.click();
      saveLink.remove();
    });
  }

  openDeckModal = (deck) => {
    this.setState({
      deckModalShow : true,
      selectedDeck : deck
    })
  }

  componentDidMount () {
    this.handleUpdate();
    this.getCards();
  }

  render() {
    const {decks, selectedDeck} = this.state;
    return (
      <Layout>
        <Header style={{ position: 'fixed', zIndex: 1, width: '100%', backgroundColor: "white" }}>
          <div className="logo" />
          <Menu
            mode="horizontal"
            defaultSelectedKeys={['1']}
            onSelect={menu => {
              this.setState({
                topVisible : menu.key === "1"
              });
            }}
          >
            <Menu.Item key="1">热门卡组 Top 20</Menu.Item>
            <Menu.Item key="2">卡片分类</Menu.Item>
          </Menu>
        </Header>
        <Content style={{padding: "10px", marginTop: "60px"}}>
          {
            this.state.topVisible

            ?
           
            <Row>
              <Col span={11} style={{backgroundColor: "white", padding: "20px"}}>
                <div>
                  <Text>时间：</Text>
                  <Select defaultValue="1d" onSelect={v => this.setState({time : v})}>
                    <Option value="1d">1d</Option>
                    <Option value="3d">3d</Option>
                    <Option value="5d">5d</Option>
                    <Option value="7d">7d</Option>
                  </Select>

                  <Text style={{marginLeft: "30px"}}>类型：</Text>
                  <Select defaultValue="TopLadder" onSelect={v => this.setState({type : v})}>
                    <Option value="TopLadder">Top 1000 Ladder</Option>
                    <Option value="GC">终极挑战</Option>
                  </Select>

                  <Text style={{marginLeft: "30px"}}>排序：</Text>
                  <Select defaultValue="pop" onSelect={v => this.setState({sort : v})}>
                    <Option value="pop">热门</Option>
                    <Option value="win">胜率</Option>
                  </Select>

                  <Button onClick={() => this.handleUpdate()} style={{float: "right"}} type="primary" loading={this.state.decksLoding}>更新</Button>
                </div>
                <>
                  {
                    decks.map((item) => (
                      <Card key={item.sort} title={item.name + `    排名：${item.sort}`} extra={
                        <>
                        <Button type="primary" style={{marginRight: "20px"}} onClick={() => this.openDeckModal(item)}>导出图片</Button>
                        <Button type="primary">查看对战卡组</Button>
                        </>
                      } style={{ marginTop: "20px", width: "100%" }}>
                        <Row style={{padding: "10px"}}>
                          <Col span={15}>
                            <Row gutter={1}>
                              {
                                item.cards.map((pic, index) => {
                                  if(index < 4){
                                    return (
                                      <Col span={6}>
                                        <img alt={pic.name} src={require(`../cards-png8/${this.getLocalSrc(pic.src)}`)} style={{width: "100%", height: "100%"}}/>
                                      </Col>
                                    )
                                  }
                                })
                              }
                            </Row>
                            <Row gutter={1}>
                              {
                                item.cards.map((pic, index) => {
                                  if(index >= 4){
                                    return (
                                      <Col span={6}>
                                        <img alt={pic.name} src={require(`../cards-png8/${this.getLocalSrc(pic.src)}`)} style={{width: "100%", height: "100%"}}/>
                                      </Col>
                                    )
                                  }
                                })
                              }
                            </Row>
                          </Col>
                          <Col span={8} offset={1}>
                            <Row gutter={1}>
                              <Col span={16}><Text>对战总场次：</Text></Col>
                              <Col span={8}><Text>{item.usage}</Text></Col>
                            </Row>
                            <Row gutter={1} style={{marginTop: "10px"}}>
                              <Col span={16}><Text>平均水费：</Text></Col>
                              <Col span={8}><Text>{item.avgElixir}</Text></Col>
                            </Row>
                            <Row gutter={1} style={{marginTop: "10px"}}>
                              <Col span={16}><Text>最小4卡循环周期：</Text></Col>
                              <Col span={8}><Text>{item.cardCycle}</Text></Col>
                            </Row>
                            <Row gutter={1} style={{marginTop: "10px"}}>
                              <Col span={8}>
                                <Text>使用率：</Text>
                              </Col>
                              <Col span={8}>
                                <Text>{item.usage}</Text>
                              </Col>
                              <Col span={8}>
                                <Text>{item.usagePercent}</Text>
                              </Col>
                            </Row>
                            <Row gutter={1} style={{marginTop: "10px"}}>
                              <Col span={8}>
                                <Text>胜场率：</Text>
                              </Col>
                              <Col span={8}>
                                <Text>{item.wins}</Text>
                              </Col>
                              <Col span={8}>
                                <Text>{item.winsPercent}</Text>
                              </Col>
                            </Row>
                            <Row gutter={1} style={{marginTop: "10px"}}>
                              <Col span={8}>
                                <Text>纯胜率：</Text>
                              </Col>
                              <Col span={8}>
                                <Text>{item.netWins}</Text>
                              </Col>
                              <Col span={8}>
                                <Text>{item.netWinsPercent}</Text>
                              </Col>
                            </Row>
                            <Row gutter={1} style={{marginTop: "10px"}}>
                              <Col span={8}>
                                <Text>平局率：</Text>
                              </Col>
                              <Col span={8}>
                                <Text>{item.draws}</Text>
                              </Col>
                              <Col span={8}>
                                <Text>{item.drawsPercent}</Text>
                              </Col>
                            </Row>
                            <Row gutter={1} style={{marginTop: "10px"}}>
                              <Col span={8}>
                                <Text>败场率：</Text>
                              </Col>
                              <Col span={8}>
                                <Text>{item.losses}</Text>
                              </Col>
                              <Col span={8}>
                                <Text>{item.lossesPercent}</Text>
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                      </Card>
                    ))
                  }
                </>
              </Col>
              <Col span={12} offset={1} style={{backgroundColor: "white", padding: "20px"}}>
                <div>
                  <Text>类型：</Text>
                  <Select defaultValue="TopLadder">
                    <Option value="TopLadder">Ladder Top 200</Option>
                    <Option value="GC">终极挑战</Option>
                  </Select>

                  <Button style={{float: "right"}} type="primary">更新</Button>
                </div>
              </Col>
            </Row>
            
            :

            <div style={{margin: "10px", padding : "20px", backgroundColor: "#FFFFFF"}}>
              <Row gutter={1}>
                <Col span={3}>
                  <Text>时间：</Text>
                  <Select defaultValue="7d" onSelect={v => this.setState({cardTime : v})}>
                    <Option value="1d">1d</Option>
                    <Option value="3d">3d</Option>
                    <Option value="7d">7d</Option>
                    <Option value="14d">14d</Option>
                  </Select>
                </Col>
                <Col span={5}>
                  <Text>对战：</Text>
                  <Select defaultValue="GC" onSelect={v => this.setState({cardBattleType : v})}>
                    <Option value="GC">终极挑战</Option>
                    <Option value="Top200Ladder">Top 1000</Option>
                  </Select>
                </Col>
                <Col span={3}>
                  <Button onClick={() => this.getCards()} type="primary" loading={this.state.cardsLoading}>更新</Button>
                </Col>
                <Col span={5} offset={1}>
                  <Text>卡片类型：</Text>
                  <Select style={{width:"100px"}} defaultValue="spells" onSelect={(v, options) => {
                        this.setState({cardType : v, cardTypeName : options.children});
                        const selectedCards = this.state.cards.filter(card => {
                          if(card.type.indexOf(v) > -1){
                            return true;
                          } 
                        });
                        let pageCards = selectedCards.slice(0, 25);
                        this.setState({selectedCards, pageCards, page : 1});
                      }
                    }
                  >
                    <Option value="spells">法术</Option>
                    <Option value="building">建筑</Option>
                    <Option value="nucleus">核心卡牌</Option>
                    <Option value="ground">地面部队</Option>
                    <Option value="air">空军部队</Option>
                  </Select>
                </Col>
                <Col span={3}>
                  <Text>背景：</Text>
                  <Select defaultValue="transparent" onSelect={v => {
                        this.setState({cardsBgColor : v});
                      }
                    }
                  >
                    <Option value="transparent">透明</Option>
                    <Option value="black">黑色</Option>
                  </Select>
                </Col>
                <Col span={3}>
                  <Button onClick={() => this.handleExportImg("cards")} type="primary">导出图片</Button>
                </Col>
              </Row>
              <div ref={this.cardsRef} style={{backgroundColor: this.state.cardsBgColor, width: "960px", height: "540px", margin:"auto", marginTop: "50px"}}>
                <Row justify="center">
                  <Col>
                    <Text strong style={{color : "#FFFFFF", fontSize : "80px", fontFamily : "方正兰亭粗黑简体"}}>{this.state.cardTypeName}</Text>
                  </Col>
                </Row>
                <Row style={{padding:"20px", paddingBottom:"0px"}}>
                  <Col span={24}>
                    <div style={{float:"left", display:"flex", justifyContent:"center", alignItems:"center"}}>
                      <Text style={{width : "40px", marginTop:"50px", fontSize:"25px", color:"#FFFFFF"}}>使用率</Text>
                    </div>
                    <div style={{width:"880px", height:"170px", float:"left", display:"flex", justifyContent:"flex-start", alignItems:"flex-end"}}>
                      {
                        this.state.pageCards.map(card => {
                          return (
                            <div style={{height: `${card.usagePercent * 4 + 20}px`, maxWidth:"50px", flex : "1", backgroundColor: "#50A9E7", margin:"2px", display:"flex", justifyContent:"center", alignItems:"center"}}>
                              <Text strong style={{color:"#FFFFFF"}}>{card.usagePercent}</Text>
                            </div>
                          );
                        })
                      }
                    </div>
                    <div style={{width:"880px", float:"left", marginLeft:"40px",marginTop:"-4px", display:"flex", justifyContent:"flex-start", alignItems:"flex-end"}}>
                      {
                        this.state.pageCards.map(card => {
                          return (
                            <div style={{height: "12px", maxWidth:"50px", padding:"2px", flex : "1", backgroundColor: "#50A9E7", margin:"2px", display:"flex", justifyContent:"flex-end", alignItems:"center"}}>
                              <Text style={{color:"#FFFFFF", fontSize:"8px"}}>{card.usageDelta}</Text>
                            </div>
                          );
                        })
                      }
                    </div>
                  </Col>
                </Row>
                <Row style={{padding:"10px", paddingTop: "0px", margin:"10px", marginTop:"0px", backgroundColor:"#66666666"}}>
                  <Col span={24}>
                    <div style={{float:"left", display:"flex", justifyContent:"center", alignItems:"center"}}>
                      <Text style={{width : "40px", fontSize:"25px", color:"#FFFFFF"}}>胜率</Text>
                    </div>
                    <div style={{width:"880px", float:"left", display:"flex", justifyContent:"flex-start", alignItems:"flex-end"}}>
                      {
                        this.state.pageCards.map(card => {
                          return (
                            <div style={{height: "20px", maxWidth:"50px", flex : "1", backgroundColor: "green", margin:"2px", display:"flex", justifyContent:"center", alignItems:"center"}}>
                              <Text strong style={{color:"#FFFFFF"}}>{card.winPercent}</Text>
                            </div>
                          );
                        })
                      }
                    </div>
                    <div style={{width:"880px", float:"left", marginLeft:"40px",marginTop:"-58px", display:"flex", justifyContent:"flex-start", alignItems:"flex-end"}}>
                      {
                        this.state.pageCards.map(card => {
                          return (
                            <div style={{height: "12px", maxWidth:"50px", padding:"2px", flex : "1", backgroundColor: "green", margin:"2px", display:"flex", justifyContent:"flex-end", alignItems:"center"}}>
                              <Text style={{color:"#FFFFFF", fontSize:"8px"}}>{card.winDelta}</Text>
                            </div>
                          );
                        })
                      }
                    </div>
                    <div style={{width:"880px", float:"left", marginLeft:"40px",marginTop:"-40px", display:"flex", justifyContent:"flex-start", alignItems:"flex-end"}}>
                      {
                        this.state.pageCards.map((card, index) => {
                          return (
                            <div style={{flex : "1", maxWidth:"50px", margin:"2px", padding:"2px"}}>
                              <img style={{height: "100%", width:"100%"}} src={require(`../cards-png8/${card.name}.png`)} />
                            </div>
                          );
                        })
                      }
                    </div>
                  </Col>
                </Row>
              </div>

              <Row justify="center" style={{marginTop:"20px"}}>
                <Col>
                  <Pagination current={this.state.page} onChange={page => {
                    let pageCards = [];
                    if(page === 1) {
                      pageCards = this.state.selectedCards.slice(0, 25);
                    }else{
                      pageCards = this.state.selectedCards.slice(25);
                    }
                    this.setState({page, pageCards})
                  }} pageSize={25} total={this.state.selectedCards.length} />

                </Col>
              </Row>
              
            </div>
          }
          </Content>
        {
          Object.keys(selectedDeck).length == 0
          ?
          null
          :
          <Modal title="导出为图片" centered={true} okText="确认导出" maskClosable={false} visible={this.state.deckModalShow}
              onOk={() => this.handleExportImg("deck")} destroyOnClose={true}
              cancelText="取消" onCancel={() => this.setState({deckModalShow : false, selectedDeck : {}, bgColor : "transparent", textColor : "#000000"})}
              width="1000px"
          >
            <Row gutter={1}>
              <Col span={8}>
                <Text>背景：</Text>
                <Select defaultValue="transparent" onSelect={v => this.setState({bgColor : v})}>
                  <Option value="transparent">透明</Option>
                  <Option value="black">黑色</Option>
                </Select>
              </Col>
              <Col span={16}>
                <Text>文字颜色：</Text>
                <Input placeholder="输入RGB颜色，例：#000000" style={{width: "300px"}} onChange={e => this.setState({textColor : e.target.value})}></Input>
              </Col>
            </Row>
            <div ref={this.deckRef} style={{width : "960px", height : "540px", backgroundColor : this.state.bgColor, marginTop : "10px"}}>
              <Row justify="center">
                <Col>
                  <Text strong style={{color : this.state.textColor, fontSize : "80px"}}>第 {selectedDeck.sort} 名</Text>
                </Col>
              </Row>
              <Row>
                <Col span={12} offset={1}>
                  <Text strong style={{color : this.state.textColor, fontSize : "20px"}}> *2020/03/15 ~ 2020/03/21 对战总场次：{selectedDeck.usage}</Text>
                </Col>
                <Col span={4}>
                  <Text strong style={{color : this.state.textColor, fontSize : "20px"}}>平均水费：{selectedDeck.avgElixir}</Text>
                </Col>
                <Col span={5}>
                  <Text strong style={{color : this.state.textColor, fontSize : "20px"}}>最小4卡循环周期：{selectedDeck.cardCycle}</Text>
                </Col>
              </Row>
              <Row gutter={1} style={{marginTop: "10px"}}>
                <Col span={4}>
                  <Row justify="center">
                    <Text strong style={{color : this.state.textColor, fontSize : "40px", fontFamily : "方正兰亭粗黑简体"}}>使用率</Text>
                  </Row>
                  <Row justify="center">
                    <Text strong style={{color : this.state.textColor, fontSize : "40px", fontFamily : "Times New Roman", marginTop: "-10px"}}>{selectedDeck.usagePercent}</Text>
                  </Row>
                  <Row justify="center">
                    <Text strong style={{color : this.state.textColor, fontSize : "40px", fontFamily : "方正兰亭粗黑简体", marginTop: "10px"}}>纯胜率</Text>
                  </Row>
                  <Row justify="center">
                    <Text strong style={{color : this.state.textColor, fontSize : "40px", fontFamily : "Times New Roman", marginTop: "-10px"}}>{selectedDeck.netWinsPercent}</Text>
                  </Row>
                </Col>
                <Col span={15}>
                  <Row gutter={1}>
                    {
                      selectedDeck.cards.map((pic, index) => {
                        if(index < 4){
                          return (
                            <Col span={6}>
                              <img alt={pic.name} src={require(`../cards-png8/${this.getLocalSrc(pic.src)}`)} style={{width: "100%", height: "100%"}}/>
                            </Col>
                          )
                        }
                      })
                    }
                  </Row>
                  <Row gutter={1}>
                    {
                      selectedDeck.cards.map((pic, index) => {
                        if(index >= 4){
                          return (
                            <Col span={6}>
                              <img alt={pic.name} src={require(`../cards-png8/${this.getLocalSrc(pic.src)}`)} style={{width: "100%", height: "100%"}}/>
                            </Col>
                          )
                        }
                      })
                    }
                  </Row>
                </Col>
                <Col span={5}>
                  <Row justify="center">
                    <Text strong style={{color : this.state.textColor, fontSize : "40px", fontFamily : "方正兰亭粗黑简体"}}>胜场率</Text>
                  </Row>
                  <Row justify="center">
                    <Text strong style={{color : this.state.textColor, fontSize : "40px", fontFamily : "Times New Roman", marginTop: "-10px"}}>{selectedDeck.winsPercent}</Text>
                  </Row>
                  <Row justify="center">
                    <Text strong style={{color : this.state.textColor, fontSize : "40px", fontFamily : "方正兰亭粗黑简体", marginTop: "10px"}}>平局率</Text>
                  </Row>
                  <Row justify="center">
                    <Text strong style={{color : this.state.textColor, fontSize : "40px", fontFamily : "Times New Roman", marginTop: "-10px"}}>{selectedDeck.drawsPercent}</Text>
                  </Row>
                  <Row justify="center">
                    <Text strong style={{color : this.state.textColor, fontSize : "40px", fontFamily : "方正兰亭粗黑简体", marginTop: "10px"}}>败场率</Text>
                  </Row>
                  <Row justify="center">
                    <Text strong style={{color : this.state.textColor, fontSize : "40px", fontFamily : "Times New Roman", marginTop: "-10px"}}>{selectedDeck.lossesPercent}</Text>
                  </Row>
                </Col>
              </Row>
            </div>
          </Modal>
        }
      </Layout>
    );
  }
}

export default App;
