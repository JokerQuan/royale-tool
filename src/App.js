import React, { Component } from 'react';
import { Layout, Menu, Button, Select, Typography, Row, Col, Card, Modal, Input, Pagination, Table, message, Radio } from 'antd';
import html2canvas from "html2canvas";
import moment from "moment";

import Ajax from "./api/ajax";
import './App.css';
import cardsType from "./cards.json";
import RadioGroup from 'antd/lib/radio/group';

const { Header, Content } = Layout;
const { Option } = Select;
const { Text } = Typography;

class App extends Component {

  constructor() {
    super();
    this.deckRef = React.createRef();
    this.cardsRef = React.createRef();
    this.battlesRef = React.createRef();
  }

  state = {
    time : "7d",
    sort : "win",
    type : "TopLadder",
    decks : [],
    decksLoding : true,
    deckModalShow : false,
    battlesTime : "",
    battleDeckCards : "",
    battleDecks : [],
    selectedDeck : {},
    bgColor : "black",
    textColor : "#FFFFFF",
    battlesType : "LadderTop200",
    battlesLoading : false,
    selectedRowKeys : [],
    selectedRows : [],
    battlesModalShow : false,
    battlesBgColor : "black",
    battlesTextColor : "#FFFFFF",
    battlesTitle : "优势对战卡组",
    sortDirection : "win",

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
    cardsBgColor : "black",
    cardsTextColor : "#FFFFFF"
  }

  handleUpdate = async () => {
    this.setState({
      decksLoding : true
    });
    const {time, sort, type} = this.state;
    const resp = await Ajax.get('/home', {time, sort, type});
    let decks = [];
    if(resp && resp.data && resp.data.length > 0){
      decks = resp.data;
    }
    this.setState({
      decks : decks,
      decksLoding : false,
      battlesTime : `${moment().add(-(time.split("d")[0]), 'day').format('YYYY/MM/DD')} ~ ${moment().format('YYYY/MM/DD')}`
    });

    if(decks.length > 0) {
      message.success("热门卡组更新成功！");
    }else{
      message.warning("热门卡组数据获取异常，请前往官网查看！");
    }
    
  }

  getMatchup = async deck => {
    this.setState({
      battlesLoading : true
    })
    const {battlesType} = this.state;
    const battleDeckCards = deck.battleUrl.split("?name=")[1];

    const resp = await Ajax.get('/battles', {cards : battleDeckCards, battlesType});
    let battleDecks = [];
    if(resp && resp.data && resp.data.length > 0) {
      battleDecks = resp.data.map(deck => {
        deck.key = deck.cards;
        return deck;
      });
    }
    
    this.setState({
      battleDeckCards,
      battleDecks,
      battlesLoading : false,
      selectedRowKeys : [],
      selectedRows : []
    });

    if (battleDecks.length > 0){
      message.success("对战卡组数据获取成功！");
      this.handleSortSelect(this.state.sortDirection);
    } else {
      message.warning("对战数据获取异常，请前往官网查看！");
    }
  }

  getCards = async () => {
    this.setState({
      cardsLoading : true
    });
    const {cardTime, cardBattleType} = this.state;
    const resp = await Ajax.get('/cards', {cardTime, cardBattleType});

    let cards = [], selectedCards = [], pageCards = [];

    if (resp && resp.data && resp.data.length > 0) {
      cards = cardsType.map(cardType => {
        return resp.data.find(card => {
          if(cardType.name === card.name){
            card.type = cardType.type;
            return card;
          }
        });
      }).sort((a, b) => {
        return b.usagePercent - a.usagePercent;
      });
  
      selectedCards = cards.filter(card => {
        if(card.type.indexOf(this.state.cardType) > -1){
          return true;
        }
      });
  
      pageCards = selectedCards.slice(0, 25);
    }

    this.setState({
      cards,
      cardsLoading : false,
      selectedCards,
      pageCards
    });
    
    if (cards.length > 0) {
      message.success("卡牌使用数据更新成功！");
    } else {
      message.warning("卡牌使用数据获取异常，请前往官网查看！");
    }
    
  }

  getLocalSrc = url => {
    const imgSrc = url.split("/cards-150/")[1];
    return imgSrc;
  }

  handleExportImg = (type) => {
    const {selectedDeck, bgColor, cardsBgColor, battlesBgColor} = this.state;
    let scale, exportNode, exportName, backgroundColor;
    switch(type){
      case "deck":
        scale = 2;
        exportNode = this.deckRef.current;
        exportName = selectedDeck.name;
        backgroundColor = (bgColor === "transparent" ? null : bgColor);
        break;
      case "cards":
        scale = 2;
        exportNode = this.cardsRef.current;
        exportName = this.state.cardType;
        backgroundColor = (cardsBgColor === "transparent" ? null : cardsBgColor);
        break;
      case "battles":
        scale = 1.75;
        exportNode = this.battlesRef.current;
        exportName = "battles";
        backgroundColor = (battlesBgColor === "transparent" ? null : battlesBgColor);
    }
    const options = {
      scale,
      backgroundColor,
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

  getWinPercentColor = winPercent => {
    const winPercentNumber = +winPercent;
    if(winPercentNumber > 51) {
      return "#75ab3b";
    }else if(winPercentNumber > 50){
      return "#98973b";
    }else if(winPercentNumber > 49){
      return "#9f953c";
    }else if(winPercentNumber > 48){
      return "#bb853f";
    }else if(winPercentNumber > 45){
      return "#db7745";
    }else{
      return "#ff6448";
    }
  }

  handleSortSelect = v => {
    const battlesDecks = this.state.battleDecks.concat();
    battlesDecks.sort((a, b) => {
      if (v === "win") {
        this.setState({battlesTitle : "优势对战卡组"});
        return b.winPercent.split("%")[0] - a.winPercent.split("%")[0];
      } else {
        this.setState({battlesTitle : "劣势对战卡组"});
        return a.winPercent.split("%")[0] - b.winPercent.split("%")[0];
      }
    });

    const selectedRowKeys = [];
    const selectedRows = [];
    for(let i = 0; i < 4; i++){
      selectedRowKeys.push(battlesDecks[i].cards);
      selectedRows.push(battlesDecks.find(deck => {
        return deck.cards === battlesDecks[i].cards;
      }));
    }

    this.setState({
      sortDirection : v,
      selectedRowKeys,
      selectedRows
    });

  }

  getEmpty = (padding) => {
    const emptys = [];
    if(this.state.page === 2 && this.state.pageCards.length < 25) {
      for (let i = 0, total = 25 - this.state.pageCards.length; i < total; i++){
        emptys.push(
          <div style={{flex : "1", maxWidth:"50px", margin:"2px",padding:`${padding}px`}}></div>
        );
      }
    }
    return emptys;
  }

  openDeckModal = (deck) => {
    this.setState({
      deckModalShow : true,
      selectedDeck : deck
    })
  }

  openBattlesModal = () => {
    const {selectedRowKeys} = this.state;
    if (selectedRowKeys.length !== 4) {
      message.warning(`必须选择 4 个卡组！你当前选择了 ${selectedRowKeys.length} 个！`);
      return;
    }
    this.setState({
      battlesModalShow : true
    })
  }

  componentDidMount () {
    this.handleUpdate();
    this.getCards();
  }

  render() {
    const {decks, selectedDeck} = this.state;
    const columns = [
      {
        title : "卡组",
        dataIndex : "cards",
        render : cards => {
          return (
            <div>
              <Row>
                {
                  cards.split(",").map((cardName, index) => {
                    if (index < 4) {
                      return (
                        <Col span={6}>
                          <img style={{width:"100%", height:"100%"}} src={require(`../cards-png8/${cardName}.png`)} />
                        </Col>
                      )
                    }
                  })
                }
              </Row>
              <Row>
                {
                  cards.split(",").map((cardName, index) => {
                    if (index >= 4) {
                      return (
                        <Col span={6}>
                          <img style={{width:"100%", height:"100%"}} src={require(`../cards-png8/${cardName}.png`)} />
                        </Col>
                      )
                    }
                  })
                }
              </Row>
            </div>
          )
        }
      },
      {
        title : "使用场次",
        dataIndex : "usage",
        sorter: (a, b) => a.usage.split(",").join("") - b.usage.split(",").join(""),
      },
      {
        title : "场均净胜皇冠",
        dataIndex : "crowns",
        sorter: (a, b) => a.crowns - b.crowns,
      },
      {
        title : "净胜率",
        dataIndex : "netWinPercent",
        sorter: (a, b) => a.netWinPercent.split("%")[0] - b.netWinPercent.split("%")[0],
      },
      {
        title : "胜场",
        dataIndex : "win",
        sorter: (a, b) => a.win - b.win,
      },
      {
        title : "胜场率",
        dataIndex : "winPercent",
        defaultSortOrder: 'descend',
        sorter: (a, b) => a.winPercent.split("%")[0] - b.winPercent.split("%")[0],
      },
      {
        title : "平局",
        dataIndex : "draw",
        sorter: (a, b) => a.draw - b.draw,
      },
      {
        title : "平局率",
        dataIndex : "drawPercent",
        sorter: (a, b) => a.drawPercent.split("%")[0] - b.drawPercent.split("%")[0],
      },
      {
        title : "败场",
        dataIndex : "loss",
        sorter: (a, b) => a.loss - b.loss,
      },
      {
        title : "败场率",
        dataIndex : "lossPercent",
        sorter: (a, b) => a.lossPercent.split("%")[0] - b.lossPercent.split("%")[0],
      },
      {
        title : "总场次",
        dataIndex : "total",
        sorter: (a, b) => a.total - b.total,
      },
    ];

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
        <Content style={{padding: "10px", marginTop: "70px"}}>
          {
            this.state.topVisible

            ?
           
            <Row>
              <Col span={9} style={{backgroundColor: "white", padding: "20px"}}>
                <div>
                  <Text>时间：</Text>
                  <Select defaultValue={this.state.time} onSelect={v => this.setState({time : v})}>
                    <Option value="1d">1d</Option>
                    <Option value="3d">3d</Option>
                    <Option value="5d">5d</Option>
                    <Option value="7d">7d</Option>
                  </Select>

                  <Text style={{marginLeft: "30px"}}>类型：</Text>
                  <Select defaultValue={this.state.type} onSelect={v => this.setState({type : v})}>
                    <Option value="TopLadder">Top 1000 Ladder</Option>
                    <Option value="GC">终极挑战</Option>
                  </Select>

                  <Text style={{marginLeft: "30px"}}>排序：</Text>
                  <Select defaultValue={this.state.sort} onSelect={v => this.setState({sort : v})}>
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
                        <Button type="primary" onClick={() => this.getMatchup(item)} loading={this.state.battlesLoading}>查看对战卡组</Button>
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
              <Col span={15} style={{padding: "20px"}}>
                <div>
                  <Text>类型：</Text>
                  <Select defaultValue={this.state.battlesType} onSelect={v => this.setState({battlesType : v})}>
                    <Option value="LadderTop200">Ladder Top 200</Option>
                    <Option value="GC">终极挑战</Option>
                  </Select>
                  <Button style={{float: "right"}} type="primary" onClick={() => this.openBattlesModal()}>导出图片</Button>
                  <Select style={{float: "right", marginRight:"20px"}} defaultValue="win" onSelect={v => this.handleSortSelect(v)}>
                    <Option value="win">正序</Option>
                    <Option value="loss">倒序</Option>
                  </Select>
                  <Text style={{float: "right", margin:"5px"}}>按胜率选择卡组：</Text>
                </div>
                <Table style={{marginTop:"20px"}} loading={this.state.battlesLoading}
                    dataSource={this.state.battleDecks} columns={columns} bordered={true} pagination={false} 
                    align="center" locale={{emptyText : '请在左边点击对应卡组右上方的"查看对战卡组"按钮'}}
                    rowSelection={
                      {
                        type:"checkbox", 
                        selectedRowKeys: this.state.selectedRowKeys, 
                        onChange : (selectedRowKeys, selectedRows) => {
                          this.setState({ selectedRowKeys, selectedRows });
                        },
                      }
                    }
                />
              </Col>
            </Row>
            
            :

            <div style={{margin: "10px", padding : "20px", backgroundColor: "#FFFFFF"}}>
              <Row gutter={1}>
                <Col span={2}>
                  <Text>时间：</Text>
                  <Select defaultValue={this.state.cardTime} onSelect={v => this.setState({cardTime : v})}>
                    <Option value="1d">1d</Option>
                    <Option value="3d">3d</Option>
                    <Option value="7d">7d</Option>
                    <Option value="14d">14d</Option>
                  </Select>
                </Col>
                <Col span={5}>
                  <Text>对战：</Text>
                  <Select defaultValue={this.state.cardBattleType} onSelect={v => this.setState({cardBattleType : v})}>
                    <Option value="GC">终极挑战</Option>
                    <Option value="Top200Ladder">Top 1000</Option>
                  </Select>
                </Col>
                <Col span={1}>
                  <Button onClick={() => this.getCards()} type="primary" loading={this.state.cardsLoading}>更新</Button>
                </Col>
                <Col span={5} offset={1}>
                  <Text>卡片类型：</Text>
                  <Select style={{width:"100px"}} defaultValue={this.state.cardType} onSelect={(v, options) => {
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
                  <Select defaultValue={this.state.cardsBgColor} onSelect={v => {
                        this.setState({cardsBgColor : v});
                      }
                    }
                  >
                    <Option value="transparent">透明</Option>
                    <Option value="black">黑色</Option>
                  </Select>
                </Col>
                <Col span={4}>
                  <Text>文字颜色：</Text>
                  <Input placeholder="输入RGB颜色，例：#000000" style={{width: "210px"}} onChange={e => this.setState({cardsTextColor : e.target.value})}></Input>
                </Col>
                <Col span={2}>
                  <Button onClick={() => this.handleExportImg("cards")} type="primary">导出图片</Button>
                </Col>
              </Row>
              <div ref={this.cardsRef} style={{backgroundColor: this.state.cardsBgColor, width: "960px", height: "540px", margin:"auto", marginTop: "50px"}}>
                <Row justify="center">
                  <Col>
                    <Text strong style={{color : this.state.cardsTextColor, fontSize : "80px", fontFamily : "方正兰亭粗黑简体"}}>{this.state.cardTypeName}</Text>
                  </Col>
                </Row>
                <Row style={{padding:"20px", paddingBottom:"0px"}}>
                  <Col span={24}>
                    <div style={{float:"left", display:"flex", justifyContent:"center", alignItems:"center"}}>
                      <Text style={{width : "40px", marginTop:"50px", fontSize:"25px", color:this.state.cardsTextColor}}>使用率</Text>
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
                      {
                        this.getEmpty(0)
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
                      {
                        this.getEmpty(2)
                      }
                    </div>
                  </Col>
                </Row>
                <Row style={{padding:"10px", paddingTop: "0px", margin:"10px", marginTop:"0px", backgroundColor:"#66666666"}}>
                  <Col span={24}>
                    <div style={{float:"left", display:"flex", justifyContent:"center", alignItems:"center"}}>
                      <Text style={{width : "40px", fontSize:"25px", color:this.state.cardsTextColor}}>胜率</Text>
                    </div>
                    <div style={{width:"880px", float:"left", display:"flex", justifyContent:"flex-start", alignItems:"flex-end"}}>
                      {
                        this.state.pageCards.map(card => {
                          return (
                            <div style={{height: "20px", maxWidth:"50px", flex : "1", backgroundColor: this.getWinPercentColor(card.winPercent), margin:"2px", display:"flex", justifyContent:"center", alignItems:"center"}}>
                              <Text strong style={{color:"#FFFFFF"}}>{card.winPercent}</Text>
                            </div>
                          );
                        })
                      }
                      {
                        this.getEmpty(0)
                      }
                    </div>
                    <div style={{width:"880px", float:"left", marginLeft:"40px",marginTop:"-58px", display:"flex", justifyContent:"flex-start", alignItems:"flex-end"}}>
                      {
                        this.state.pageCards.map(card => {
                          return (
                            <div style={{height: "12px", maxWidth:"50px", padding:"2px", flex : "1", backgroundColor: this.getWinPercentColor(card.winPercent), margin:"2px", display:"flex", justifyContent:"flex-end", alignItems:"center"}}>
                              <Text style={{color:"#FFFFFF", fontSize:"8px"}}>{card.winDelta}</Text>
                            </div>
                          );
                        })
                      }
                      {
                        this.getEmpty(2)
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
                      {
                        this.getEmpty(2)
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
              cancelText="取消" onCancel={() => this.setState({deckModalShow : false, selectedDeck : {}, bgColor : "black", textColor : "#FFFFFF"})}
              width="1000px"
          >
            <Row gutter={1}>
              <Col span={8}>
                <Text>背景：</Text>
                <Select defaultValue="black" onSelect={v => this.setState({bgColor : v})}>
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
                  <Text strong style={{color : this.state.textColor, fontSize : "20px"}}>* {this.state.battlesTime} 对战总场次：{selectedDeck.usage}</Text>
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
        {
          this.state.selectedRowKeys.length === 4
          ?
          <Modal title="导出对战数据图片" centered={true} okText="确认导出" maskClosable={false} visible={this.state.battlesModalShow}
            onOk={() => this.handleExportImg("battles")} destroyOnClose={true}
            cancelText="取消" onCancel={() => this.setState({battlesModalShow : false, battlesBgColor : "black", battlesTextColor : "#FFFFFF"})}
            width="1000px"
          >
            <Row>
              <Col span={3}>
                <Text>背景：</Text>
                <Select defaultValue="black" onSelect={v => this.setState({battlesBgColor : v})}>
                  <Option value="transparent">透明</Option>
                  <Option value="black">黑色</Option>
                </Select>
              </Col>
              <Col span={8}>
                <Text>文字颜色：</Text>
                <Input placeholder="输入RGB颜色，例：#000000" style={{width: "210px"}} onChange={e => this.setState({battlesTextColor : e.target.value})}></Input>
              </Col>
              <Col span={8}>
                <Text>自定义 Title：</Text>
                <Input placeholder="输入图片 Title，例：优势对战卡组" style={{width: "210px"}} onChange={e => this.setState({battlesTitle : e.target.value})}></Input>
              </Col>
              <Col span={5}>
                <Radio.Group style={{padding:"5px"}} defaultValue={this.state.sortDirection}
                  onChange={(e) => {
                    if(e.target.value === "win"){
                      this.setState({battlesTitle : "优势对战卡组"})
                    } else {
                      this.setState({battlesTitle : "劣势对战卡组"})
                    }
                  }}
                >
                  <Radio value="win">优势</Radio>
                  <Radio value="loss">劣势</Radio>
                </Radio.Group>
              </Col>
            </Row>
            <div ref={this.battlesRef} style={{padding:"10px", width : "960px", height : "540px", backgroundColor : this.state.battlesBgColor, marginTop : "10px"}}>
              <Row justify="center">
                <Col>
                  <Text strong style={{color: this.state.battlesTextColor, fontSize:"50px", fontFamily:"方正兰亭粗黑简体"}}>
                    {this.state.battlesTitle}
                  </Text>
                </Col>
              </Row>
              <Row style={{marginTop:"10px"}}>
                <Col span={2} offset={1}>
                  <Row justify="center" style={{marginTop:"20px"}}>
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        总场次
                      </Text>
                    </Col>
                  </Row>
                  <Row justify="center">
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        {this.state.selectedRows[0].total}
                      </Text>
                    </Col>
                  </Row>
                  <Row justify="center" style={{marginTop:"20px"}}>
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        胜率
                      </Text>
                    </Col>
                  </Row>
                  <Row justify="center">
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        {this.state.selectedRows[0].winPercent}
                      </Text>
                    </Col>
                  </Row>
                </Col>
                <Col span={8}>
                  <Row>
                    {
                      this.state.selectedRows[0].cards.split(",").map((cardName, index) => {
                        if (index < 4) {
                          return (
                            <Col span={6}>
                              <img style={{width:"100%", height:"100%"}} src={require(`../cards-png8/${cardName}.png`)} />
                            </Col>
                          )
                        }
                      })
                    }
                  </Row>
                  <Row>
                    {
                      this.state.selectedRows[0].cards.split(",").map((cardName, index) => {
                        if (index >= 4) {
                          return (
                            <Col span={6}>
                              <img style={{width:"100%", height:"100%"}} src={require(`../cards-png8/${cardName}.png`)} />
                            </Col>
                          )
                        }
                      })
                    }
                  </Row>
                </Col>

                <Col span={8} offset={2}>
                  <Row>
                    {
                      this.state.selectedRows[1].cards.split(",").map((cardName, index) => {
                        if (index < 4) {
                          return (
                            <Col span={6}>
                              <img style={{width:"100%", height:"100%"}} src={require(`../cards-png8/${cardName}.png`)} />
                            </Col>
                          )
                        }
                      })
                    }
                  </Row>
                  <Row>
                    {
                      this.state.selectedRows[1].cards.split(",").map((cardName, index) => {
                        if (index >= 4) {
                          return (
                            <Col span={6}>
                              <img style={{width:"100%", height:"100%"}} src={require(`../cards-png8/${cardName}.png`)} />
                            </Col>
                          )
                        }
                      })
                    }
                  </Row>
                </Col>
                <Col span={2}>
                  <Row justify="center" style={{marginTop:"20px"}}>
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        总场次
                      </Text>
                    </Col>
                  </Row>
                  <Row justify="center">
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        {this.state.selectedRows[1].total}
                      </Text>
                    </Col>
                  </Row>
                  <Row justify="center" style={{marginTop:"20px"}}>
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        胜率
                      </Text>
                    </Col>
                  </Row>
                  <Row justify="center">
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        {this.state.selectedRows[1].winPercent}
                      </Text>
                    </Col>
                  </Row>
                </Col>
              </Row>

              <Row style={{marginTop:"30px"}}>
                <Col span={2} offset={1}>
                  <Row justify="center" style={{marginTop:"20px"}}>
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        总场次
                      </Text>
                    </Col>
                  </Row>
                  <Row justify="center">
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        {this.state.selectedRows[2].total}
                      </Text>
                    </Col>
                  </Row>
                  <Row justify="center" style={{marginTop:"20px"}}>
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        胜率
                      </Text>
                    </Col>
                  </Row>
                  <Row justify="center">
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        {this.state.selectedRows[2].winPercent}
                      </Text>
                    </Col>
                  </Row>
                </Col>
                <Col span={8}>
                  <Row>
                    {
                      this.state.selectedRows[2].cards.split(",").map((cardName, index) => {
                        if (index < 4) {
                          return (
                            <Col span={6}>
                              <img style={{width:"100%", height:"100%"}} src={require(`../cards-png8/${cardName}.png`)} />
                            </Col>
                          )
                        }
                      })
                    }
                  </Row>
                  <Row>
                    {
                      this.state.selectedRows[2].cards.split(",").map((cardName, index) => {
                        if (index >= 4) {
                          return (
                            <Col span={6}>
                              <img style={{width:"100%", height:"100%"}} src={require(`../cards-png8/${cardName}.png`)} />
                            </Col>
                          )
                        }
                      })
                    }
                  </Row>
                </Col>

                <Col span={8} offset={2}>
                  <Row>
                    {
                      this.state.selectedRows[3].cards.split(",").map((cardName, index) => {
                        if (index < 4) {
                          return (
                            <Col span={6}>
                              <img style={{width:"100%", height:"100%"}} src={require(`../cards-png8/${cardName}.png`)} />
                            </Col>
                          )
                        }
                      })
                    }
                  </Row>
                  <Row>
                    {
                      this.state.selectedRows[3].cards.split(",").map((cardName, index) => {
                        if (index >= 4) {
                          return (
                            <Col span={6}>
                              <img style={{width:"100%", height:"100%"}} src={require(`../cards-png8/${cardName}.png`)} />
                            </Col>
                          )
                        }
                      })
                    }
                  </Row>
                </Col>
                <Col span={2}>
                  <Row justify="center" style={{marginTop:"20px"}}>
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        总场次
                      </Text>
                    </Col>
                  </Row>
                  <Row justify="center">
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        {this.state.selectedRows[3].total}
                      </Text>
                    </Col>
                  </Row>
                  <Row justify="center" style={{marginTop:"20px"}}>
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        胜率
                      </Text>
                    </Col>
                  </Row>
                  <Row justify="center">
                    <Col>
                      <Text strong style={{color: this.state.battlesTextColor, fontSize:"20px", fontFamily:"方正兰亭粗黑简体"}}>
                        {this.state.selectedRows[3].winPercent}
                      </Text>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </div>
          </Modal>
          :
          null
        }
      </Layout>
    );
  }
}

export default App;
