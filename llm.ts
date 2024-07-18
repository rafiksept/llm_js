import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { RunCollectorCallbackHandler } from "@langchain/core/tracers/run_collector";
import 'dotenv/config'
const apiKey = process.env.OPENAI_API_KEY;
const sectors_api_key = process.env.SECTORS_API_KEY;
if (!sectors_api_key) throw new Error('Expected env var SECTORS_API_KEY');
if (!apiKey) throw new Error('Expected env var OPENAI_API_KEY');

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayDate = yesterday.toISOString().split('T')[0];

const model = new ChatOpenAI({
  model: "gpt-3.5-turbo", temperature: 0, apiKey: apiKey
});

const get_peers = new DynamicStructuredTool({
  name: "get_peers",
  description: "Get peers or competitors for a stock",
  schema: z.object({
    ticker: z.string().length(4, "Stock ticker should only contain up to 4 alphabetic characters").describe("Stock ticker to search for"),
    top_n: z.number().describe("The number of companies that will be returned").default(5)
  }),
  func: async ({ ticker, top_n }) => {
    const url = `https://api.sectors.app/v1/company/report/${ticker}/?sections=peers`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': sectors_api_key,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      const peers = data.peers;
      let output: { company_name: string; symbol: string }[] = [];

      if (peers) {
        let output = peers.flatMap((p: any) => 
          p.peers_info.companies.map((c: any) => ({
            company_name: c.company_name,
            symbol: c.symbol,
          }))
        );


        if (top_n > output.length || top_n > 10) {
          const result = {
            data : output.slice(0, 10),
            more : `/idx/${ticker}#peers`
          }

          return JSON.stringify(result);

        } else {
          const result = {
            data : output.slice(0, top_n),
            more : ""
          }

          return JSON.stringify(result);
        }
      } 

      return JSON.stringify(output);

    } catch (error) {
      console.error('Error fetching get_peers data:', error);
      throw error;
    }
  }
});

const get_top_companies_based_on_transaction_volume = new DynamicStructuredTool({
  name: "get_top_companies_based_on_transaction_volume",
  description: "Get top companies based on transaction volume",
  schema: z.object({
    start_date: z.string().describe("A filter indicating the date in the format of YYYY-MM-DD").default(yesterdayDate),
    top_n: z.number().describe("The number of top companies that will be returned").default(5)
  }),
  func: async ({ start_date, top_n }) => {
    const url = `https://api.sectors.app/v1/most-traded/?start=${start_date}&end=${start_date}&n_stock=${top_n}&adjusted=true`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': sectors_api_key,
          'Content-Type': 'application/json',
        },

      });
      const data = await response.json();
      const companies = data[start_date]
      let output: { company_name: string; symbol: string; value: number; }[] = [];

      if (companies?.length > 0) {
        output = companies.map((c: any) => ({
          company_name: c.company_name,
          symbol: c.symbol,
          value : c.volume
        }));

        if (top_n > output.length || top_n > 10) {
          const result = {
            data : output.slice(0, 10),
            key: "Volume",
            more : "/indonesia/most-traded"
          }

          return JSON.stringify(result);

        } else {
          const result = {
            data : output.slice(0, top_n),
            key: "Volume",
            more : ""
          }

          return JSON.stringify(result);
        }
      }

      return JSON.stringify(output);
    } catch (error) {
      console.error('Error fetching get_top_companies_based_on_transaction_volume data:', error);
      throw error;
    }
  },
})

const get_top_m_cap_companies_by_subsector = new DynamicStructuredTool({
  name: "get_top_m_cap_companies_by_subsector",
  description: "Get top companies by market capital. the subsectors from the user must be listed following 'telecommunication', 'oil-gas-coal', 'financing-service', 'investment-service','apparel-luxury-goods', 'software-it-services', 'insurance', 'heavy-constructions-civil-engineering', 'banks', 'holding-investment-companies','industrial-services', 'consumer-services', 'utilities', 'tobacco' , 'logistics-deliveries', 'multi-sector-holdings', 'healthcare-equipment-providers', 'alternative-energy', 'automobiles-components','pharmaceuticals-health-care-research', 'media-entertainment', 'basic-materials','household-goods','technology-hardware-equipment', 'properties-real-estate','industrial-goods','transportation','nondurable-household-products','transportation-infrastructure', 'food-staples-retailing', 'food-beverage', 'leisure-goods', 'retailing'",

  schema: z.object({
    sub_sector: z.string().describe("subsector of listed companies").default(""),
    top_n: z.number().describe("The number of top companies that will be returned").default(5)
  }),

  func: async ({ sub_sector, top_n }) => {
    if (!sub_sector) {
      const message_error = {
        "missed" :  "sub-sector"
      }
      
      return JSON.stringify(message_error)
    } 
    const url = `https://api.sectors.app/v1/subsector/report/${sub_sector}/?sections=companies`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': sectors_api_key,
          'Content-Type': 'application/json',
        },

      });

      const data = await response.json();
      let output: { company_name: string; symbol: string; value:number; }[] = [];

      const top_mcap = data["companies"]["top_companies"]["top_mcap"]
      if (top_mcap) {
        output = top_mcap.map((c:any) => ({
            company_name: c.name,
            symbol: c.symbol,
            value:c.market_cap
        }));    
        
        if (top_n > output.length || top_n > 5) {
          const result = {
            data : output.slice(0, 5),
            key: "Market Cap (IDR)",
            more : `/indonesia/${sub_sector}`
          }

          return JSON.stringify(result);

        } else {
          const result = {
            data : output.slice(0, top_n),
            key: "Market Cap (IDR)",
            more : ""
          }

          return JSON.stringify(result);
        }

      } 

      return JSON.stringify(output.slice(0, top_n));
    } catch (error) {
      console.error('Error fetching get_top_m_cap_companies_by_subsector data:', error);
      throw error;
    }
  },
})

const get_top_growth_companies_by_subsector = new DynamicStructuredTool({
  name: "get_top_growth_companies_by_subsector",
  description: "Get top companies by growth value. the subsectors from the user must be listed following 'telecommunication', 'oil-gas-coal', 'financing-service', 'investment-service','apparel-luxury-goods', 'software-it-services', 'insurance', 'heavy-constructions-civil-engineering', 'banks', 'holding-investment-companies','industrial-services', 'consumer-services', 'utilities', 'tobacco' , 'logistics-deliveries', 'multi-sector-holdings', 'healthcare-equipment-providers', 'alternative-energy', 'automobiles-components','pharmaceuticals-health-care-research', 'media-entertainment', 'basic-materials','household-goods','technology-hardware-equipment', 'properties-real-estate','industrial-goods','transportation','nondurable-household-products','transportation-infrastructure', 'food-staples-retailing', 'food-beverage', 'leisure-goods', 'retailing'",

  schema: z.object({
    sub_sector: z.string().describe("subsector of listed companies").default(""),
    top_n: z.number().describe("The number of top companies that will be returned").default(5)
  }),

  func: async ({ sub_sector, top_n }) => {
    if (!sub_sector) {
      const message_error = {
        "missed" :  "sub-sector"
      }
      
      return JSON.stringify(message_error)
    } 

    const url = `https://api.sectors.app/v1/subsector/report/${sub_sector}/?sections=companies`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': sectors_api_key,
          'Content-Type': 'application/json',
        },

      });

      const data = await response.json();
      const topGrowth = data["companies"]["top_companies"]["top_growth"]

      let output: { company_name: string; symbol: string; value:number; }[] = [];

      if (topGrowth) {
        output = topGrowth.map((c:any) => ({
            company_name: c.name,
            symbol: c.symbol,
            value: c.revenue_growth
        }));    
        
        if (top_n > output.length || top_n > 5) {
          const result = {
            data : output.slice(0, 5),
            key: "Revenue Growth",
            more : `/indonesia/${sub_sector}`
          }

          return JSON.stringify(result);

        } else {
          const result = {
            data : output.slice(0, top_n),
            key: "Revenue Growth",
            more : ""
          }

          return JSON.stringify(result);
        }
      } 

      return JSON.stringify(output.slice(0, top_n));
    } catch (error) {
      console.error('Error fetching get_top_growth_companies_by_subsector data:', error);
      throw error;
    }
  },
})

const get_top_revenue_companies_by_subsector = new DynamicStructuredTool({
  name: "get_top_revenue_companies_by_subsector",
  description: "Get top companies by revenue on certain sub sector. the subsectors from the user must be listed following 'telecommunication', 'oil-gas-coal', 'financing-service', 'investment-service','apparel-luxury-goods', 'software-it-services', 'insurance', 'heavy-constructions-civil-engineering', 'banks', 'holding-investment-companies','industrial-services', 'consumer-services', 'utilities', 'tobacco' , 'logistics-deliveries', 'multi-sector-holdings', 'healthcare-equipment-providers', 'alternative-energy', 'automobiles-components','pharmaceuticals-health-care-research', 'media-entertainment', 'basic-materials','household-goods','technology-hardware-equipment', 'properties-real-estate','industrial-goods','transportation','nondurable-household-products','transportation-infrastructure', 'food-staples-retailing', 'food-beverage', 'leisure-goods', 'retailing'",

  schema: z.object({
    sub_sector: z.string().describe("subsector of listed companies").default(""),
    top_n: z.number().describe("The number of top companies that will be returned").default(5)
  }),

  func: async ({ sub_sector, top_n }) => {
    if (!sub_sector) {
      const message_error = {
        "missed" :  "sub-sector"
      }
      
      return JSON.stringify(message_error)
    } 
    const url = `https://api.sectors.app/v1/subsector/report/${sub_sector}/?sections=companies`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': sectors_api_key,
          'Content-Type': 'application/json',
        },

      });

      const data = await response.json();
      const topRevenue = data["companies"]["top_companies"]["top_revenue"]
      let output: { company_name: string; symbol: string; value:number; }[] = [];

      if (topRevenue) {
        output = topRevenue.map((c:any) => ({
            company_name: c.name,
            symbol: c.symbol,
            value: c.revenue_ttm 
        }));          

        if (top_n > output.length || top_n > 5) {
          const result = {
            data : output.slice(0, 5),
            key: "Revenue (IDR)",
            more : `/indonesia/${sub_sector}`
          }

          return JSON.stringify(result);

        } else {
          const result = {
            data : output.slice(0, top_n),
            key: "Revenue (IDR)",
            more : ""
          }

          return JSON.stringify(result);
        }

      } 

      return JSON.stringify(output.slice(0, top_n));
    } catch (error) {
      console.error('Error fetching get_top_revenue_companies_by_subsector data:', error);
      throw error;
    }
  },
})

const get_top_change_companies_by_subsector = new DynamicStructuredTool({
  name: "get_top_change_companies_by_subsector",
  description: "Get top companies by price change. the subsectors from the user must be listed following 'telecommunication', 'oil-gas-coal', 'financing-service', 'investment-service','apparel-luxury-goods', 'software-it-services', 'insurance', 'heavy-constructions-civil-engineering', 'banks', 'holding-investment-companies','industrial-services', 'consumer-services', 'utilities', 'tobacco' , 'logistics-deliveries', 'multi-sector-holdings', 'healthcare-equipment-providers', 'alternative-energy', 'automobiles-components','pharmaceuticals-health-care-research', 'media-entertainment', 'basic-materials','household-goods','technology-hardware-equipment', 'properties-real-estate','industrial-goods','transportation','nondurable-household-products','transportation-infrastructure', 'food-staples-retailing', 'food-beverage', 'leisure-goods', 'retailing'",

  schema: z.object({
    sub_sector: z.string().describe("subsector of listed companies").default(""),
    top_n: z.number().describe("The number of top companies that will be returned").default(5)
  }),

  func: async ({ sub_sector, top_n}) => {

    if (!sub_sector) {
      const message_error = {
        "missed" :  "sub-sector"
      }
      
      return JSON.stringify(message_error)
    } 

    const url = `https://api.sectors.app/v1/subsector/report/${sub_sector}/?sections=companies`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': sectors_api_key,
          'Content-Type': 'application/json',
        },

      });

      const data = await response.json();
      const top_change = data["companies"]["top_change_companies"]
      let output: { company_name: string; symbol: string; value:number;}[] = [];

      if (top_change) {
        output = top_change.map((c:any) => ({
            company_name: c.name,
            symbol: c.symbol,
            value: c["1mth"]
        }));          

        if (top_n > output.length || top_n > 5) {
          const result = {
            data : output.slice(0, 5),
            key: "1 Month Price Change",
            more : `/indonesia/${sub_sector}`
          }

          return JSON.stringify(result);

        } else {
          const result = {
            data : output.slice(0, top_n),
            key: "1 Month Price Change",
            more : ""
          }

          return JSON.stringify(result);
        }
      } 

      return JSON.stringify(output.slice(0, top_n));
    } catch (error) {
      console.error('Error fetching get_top_change_companies_by_subsector data:', error);
      throw error;
    }
  },
})

const get_top_dividend_yield_companies = new DynamicStructuredTool({
  name: "get_top_dividend_yield_companies",
  description: "Get top companies by dividend yield",

  schema: z.object({
    top_n: z.number().describe("The number of top companies that will be returned").default(5),
    year: z.number().describe("The year in which the data was taken").default(new Date().getFullYear())
  }),

  func: async ({ top_n, year }) => {
    const url = `https://api.sectors.app/v1/companies/top/?classifications=dividend_yield&n_stock=${top_n}&year=${year}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': sectors_api_key,
          'Content-Type': 'application/json',
        },

      });

      const data = await response.json();
      const top_dividend_yield = data["dividend_yield"]

      let output: { company_name: string; symbol: string; value:number;}[] = [];

      if (top_dividend_yield) {
        output = top_dividend_yield.map((c:any) => ({
            company_name: c.company_name,
            symbol: c.symbol,
            value: c.dividend_yield
        }));    
        
        if (top_n > output.length || top_n > 10) {
          const result = {
            data : output.slice(0, 10),
            key: "Dividend Yield",
            more : "/"
          }

          return JSON.stringify(result);

        } else {
          const result = {
            data : output.slice(0, top_n),
            key: "Dividend Yield",
            more : ""
          }

          return JSON.stringify(result);
        }
      } 

      return JSON.stringify(output);
    } catch (error) {
      console.error('Error fetching get_top_dividend_yield_companies data:', error);
      throw error;
    }
  },
})

const get_top_total_dividend_companies = new DynamicStructuredTool({
  name: "get_top_total_dividend_companies",
  description: "Get top companies by total dividend",

  schema: z.object({
    top_n: z.number().describe("The number of top companies that will be returned").default(5),
    year: z.number().describe("The year in which the data was taken").default(new Date().getFullYear())
  }),

  func: async ({ top_n, year }) => {
    const url = `https://api.sectors.app/v1/companies/top/?classifications=total_dividend&n_stock=${top_n}&year=${year}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': sectors_api_key,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      const top_total_dividend = data["total_dividend"]

      let output: { company_name: string; symbol: string; value:number;}[] = [];

      if (top_total_dividend) {
        output = top_total_dividend.map((c:any) => ({
            company_name: c.company_name,
            symbol: c.symbol,
            value: c.total_dividend
        }));     
        
        if (top_n > output.length || top_n > 10) {
          const result = {
            data : output.slice(0, 10),
            key: "Dividend (IDR)",
            more : "/"
          }

          return JSON.stringify(result);

        } else {
          const result = {
            data : output.slice(0, top_n),
            key: "Dividend (IDR)",
            more : ""
          }

          return JSON.stringify(result);
        }
      } 

      return JSON.stringify(output);
    } catch (error) {
      console.error('Error fetching get_top_total_dividend_companies data:', error);
      throw error;
    }
  },
})

const get_top_revenue_companies = new DynamicStructuredTool({
  name: "get_top_revenue_companies",
  description: "Get top companies by revenue.",

  schema: z.object({
    top_n: z.number().describe("The number of top companies that will be returned").default(5),
    year: z.number().describe("The year in which the data was taken").default(new Date().getFullYear())
  }),

  func: async ({ top_n, year }) => {
    const url = `https://api.sectors.app/v1/companies/top/?classifications=revenue&n_stock=${top_n}&year=${year}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': sectors_api_key,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      const top_revenue = data["revenue"]

      let output: { company_name: string; symbol: string; value:number; }[] = [];

      if (top_revenue) {
        output = top_revenue.map((c:any) => ({
            company_name: c.company_name,
            symbol: c.symbol,
            value: c.revenue
        }));   
        
        if (top_n > output.length || top_n > 10) {
          const result = {
            data : output.slice(0, 10),
            key: "Revenue (IDR)",
            more : "/"
          }

          return JSON.stringify(result);

        } else {
          const result = {
            data : output.slice(0, top_n),
            key: "Revenue (IDR)",
            more : ""
          }

          return JSON.stringify(result);
        }
      } 
      return JSON.stringify(output);

    } catch (error) {
      console.error('Error fetching get_top_revenue_companies data:', error);
      throw error;
    }
  },
})

const get_top_earnings_companies = new DynamicStructuredTool({
  name: "get_top_earnings_companies",
  description: "Get top companies by earnings value",

  schema: z.object({
    top_n: z.number().describe("The number of top companies that will be returned").default(5),
    year: z.number().describe("The year in which the data was taken").default(2024)
  }),

  func: async ({ top_n, year }) => {
    
    const url = `https://api.sectors.app/v1/companies/top/?classifications=earnings&n_stock=${top_n}&year=${year}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': sectors_api_key,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      const top_earnings = data["earnings"]
      let output: { company_name: string; symbol: string; value:number; }[] = [];

      if (top_earnings) {
        output = top_earnings.map((c:any) => ({
            company_name: c.company_name,
            symbol: c.symbol,
            value: c.earnings
        }));         
        
        if (top_n > output.length || top_n > 10) {
          const result = {
            data : output.slice(0, 10),
            key: "Earnings (IDR)",
            more : "/"
          }

          return JSON.stringify(result);

        } else {
          const result = {
            data : output.slice(0, top_n),
            key: "Earnings (IDR)",
            more : ""
          }

          return JSON.stringify(result);
        }
      } 

      return JSON.stringify(output);
    } catch (error) {
      console.error('Error fetching get_top_earnings_companies data:', error);
      throw error;
    }
  },
})

const get_companies_by_subsector= new DynamicStructuredTool({
  name: "get_companies_by_subsector",
  description: "get a list of companies registered in a particular sector based on following list 'telecommunication', 'oil-gas-coal', 'financing-service', 'investment-service','apparel-luxury-goods', 'software-it-services', 'insurance', 'heavy-constructions-civil-engineering', 'banks', 'holding-investment-companies','industrial-services', 'consumer-services', 'utilities', 'tobacco' , 'logistics-deliveries', 'multi-sector-holdings', 'healthcare-equipment-providers', 'alternative-energy', 'automobiles-components','pharmaceuticals-health-care-research', 'media-entertainment', 'basic-materials','household-goods','technology-hardware-equipment', 'properties-real-estate','industrial-goods','transportation','nondurable-household-products','transportation-infrastructure', 'food-staples-retailing', 'food-beverage', 'leisure-goods', 'retailing'  ",

  schema: z.object({
    sub_sector: z.string().describe("subsector of listed companies").default(""),
    top_n: z.number().describe("The number of companies that will be returned").default(5)
  }),

  func: async ({ sub_sector, top_n}) => {

    if (!sub_sector) {
      const message_error = {
        "missed" :  "sub-sector"
      }
      
      return JSON.stringify(message_error)
    } 

    const url = `https://api.sectors.app/v1/companies/?sub_sector=${sub_sector}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': sectors_api_key,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (response.status == 400) {
        return JSON.stringify([])
      }

      if (top_n > data.length || top_n > 10) {
        const result = {
          data : data.slice(0, 10),
          more : `/indonesia/${sub_sector}`
        }

        return JSON.stringify(result);

      } else {
        const result = {
          data : data.slice(0, top_n),
          more : ""
        }

        return JSON.stringify(result);
      }

      
    } catch (error) {
      console.error('Error fetching get_companies_by_subsector data:', error);
      throw error;
    }
  },
})
const get_companies_by_subindustries= new DynamicStructuredTool({
  name: "get_companies_by_subindustries",
  description: "get a list of companies registered in a particular industries based on following list 'paper', 'diversified-metals-minerals', 'electrical-components-equipment', 'housewares-specialties', 'diversified-forest', 'entertainment-movie-production', 'life-insurance','construction-machinery-heavy-vehicles', 'timber', 'alternative-energy-equipment','investment-banking-brokerage-services', 'oil-gas-production-refinery', 'investment-management', 'personal-care-products','road-transportation','fish-meat-poultry','software', 'office-supplies', 'recreational-sports-facilities', 'gas-utilities', 'sport-equipment-hobbies-goods','oil-gas-drilling-service', 'electric-utilities'",

  schema: z.object({
    sub_industry: z.string().describe("subindustry of listed companies").default(""),
    top_n: z.number().describe("The number of top compThe number of companies that will be returnedanies that will be returned").default(5)
  }),

  func: async ({ sub_industry, top_n }) => {

    if (!sub_industry) {
      const message_error = {
        "missed" :  "sub-industry"
      }
      
      return JSON.stringify(message_error)
    } 

    const url = `https://api.sectors.app/v1/companies/?sub_industry=${sub_industry}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': sectors_api_key,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (response.status == 400) {
        return JSON.stringify([])
      }

      if (top_n > data.length || top_n > 10) {
        const result = {
          data : data.slice(0, 10),
          more: ""
        }

        return JSON.stringify(result);

      } else {
        const result = {
          data : data.slice(0, top_n),
          more : ""
        }

        return JSON.stringify(result);
      }
      
    } catch (error) {
      console.error('Error fetching get_companies_by_subindustries data:', error);
      throw error;
    }
  },
})

const get_companies_by_subindustries2= new DynamicStructuredTool({
  name: "get_companies_by_subindustries2",
  description: "get a list of companies registered in a particular industries 'aluminum', 'general-insurance', 'cable-satellite', 'environmental-facilities-services','integrated-telecommunication-service', 'consumer-distributors', 'specialty-chemicals', 'tobacco', 'coal-production', 'financial-holdings', 'agricultural-chemicals', 'education-services', 'multi-sector-holdings', 'auto-parts-equipment', 'logistics-deliveries','supermarkets-convenience-store', 'broadcasting', 'oil-gas-storage-distribution','drug-retail-distributors', 'consumer-publishing', 'restaurants', 'home-furnishings','textiles', 'online-applications-services', 'advertising','home-improvement-retail', 'industrial-machinery-components'",

  schema: z.object({
    sub_industry: z.string().describe("subindustry of listed companies").default(""),
    top_n: z.number().describe("The number of top compThe number of companies that will be returnedanies that will be returned").default(5)
  }),

  func: async ({ sub_industry, top_n }) => {
    if (!sub_industry) {
      const message_error = {
        "missed" :  "sub-industry"
      }
      
      return JSON.stringify(message_error)
    } 

    const url = `https://api.sectors.app/v1/companies/?sub_industry=${sub_industry}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': sectors_api_key,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (response.status == 400) {
        return JSON.stringify([])
      }

      if (top_n > data.length || top_n > 10) {
        const result = {
          data : data.slice(0, 10),
          more : ""
        }

        return JSON.stringify(result);

      } else {
        const result = {
          data : data.slice(0, top_n),
          more : ""
        }

        return JSON.stringify(result);
      }

    } catch (error) {
      console.error('Error fetching get_companies_by_subindustries2:', error);
      throw error;
    }
  },
})

const get_companies_by_subindustries3= new DynamicStructuredTool({
  name: "get_companies_by_subindustries3",
  description: "get a list of companies registered in a particular industries 'healthcare-supplies-distributions', 'apparel-textile-retail', 'gold','iron-steel','pharmaceuticals', 'reinsurance', 'consumer-financing', 'copper', 'marine-ports-services','diversified-industrial-trading','food-retail-distributors','it-services-consulting','dairy-products','networking-equipment','heavy-constructions-civil-engineering', 'business-support-services','real-estate-services', 'airport-operators', 'electronics-retail','wired-telecommunication-service', 'electronic-equipment-instruments', 'human-resource-employment-services', 'it-services-consulting', 'clothing-accessories-bags', 'plantations-crops', 'computer-hardware','airlines','footwear'",

  schema: z.object({
    sub_industry: z.string().describe("subindustry of listed companies").default(""),
    top_n: z.number().describe("The number of top compThe number of companies that will be returnedanies that will be returned").default(5)
  }),

  func: async ({ sub_industry, top_n }) => {
    if (!sub_industry) {
      const message_error = {
        "missed" :  "sub-industry"
      }
      
      return JSON.stringify(message_error)
    } 
    const url = `https://api.sectors.app/v1/companies/?sub_industry=${sub_industry}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': sectors_api_key,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (response.status == 400) {
        return JSON.stringify([])
      }

      if (top_n > data.length || top_n > 10) {
        const result = {
          data : data.slice(0, 10),
          more : ""
        }

        return JSON.stringify(result);

      } else {
        const result = {
          data : data.slice(0, top_n),
          more : ""
        }

        return JSON.stringify(result);
      }
    } catch (error) {
      console.error('Error fetching get_companies_by_subindustries3 data:', error);
      throw error;
    }
  },
})

const get_companies_by_subindustries4= new DynamicStructuredTool({
  name: "get_companies_by_subindustries4",
  description: "get a list of companies registered in a particular industries 'automotive-retail', 'wireless-telecommunication-services', 'commercial-printing','banks', 'tires','building-products-fixtures', 'investment-companies','real-estate-development-management', 'household-appliances', 'research-consulting-services','construction-materials', 'soft-drinks','healthcare-providers','oil-gas-coal-equipment-services', 'travel-agencies', 'basic-chemicals', 'coal-distribution', 'department-stores', 'containers-packaging', 'hotels-resorts-cruise-lines', 'processed-foods', 'highways-railtracks','liquors'",

  schema: z.object({
    sub_industry: z.string().describe("subindustry of listed companies").default(""),
    top_n: z.number().describe("The number of top compThe number of companies that will be returnedanies that will be returned").default(5)
  }),

  func: async ({ sub_industry, top_n }) => {
    if (!sub_industry) {
      const message_error = {
        "missed" :  "sub-industry"
      }
      
      return JSON.stringify(message_error)
    } 

    const url = `https://api.sectors.app/v1/companies/?sub_industry=${sub_industry}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': sectors_api_key,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (response.status == 400) {
        return JSON.stringify([])
      }

      if (top_n > data.length || top_n > 10) {
        const result = {
          data : data.slice(0, 10),
          more : ""
        }

        return JSON.stringify(result);

      } else {
        const result = {
          data : data.slice(0, top_n),
          more : ""
        }

        return JSON.stringify(result);
      }
      
    } catch (error) {
      console.error('Error fetching get_companies_by_subindustries3 data:', error);
      throw error;
    }
  },
})

async function generate(query: string) {
  const tools = [
    get_peers,
    get_top_companies_based_on_transaction_volume,
    get_top_m_cap_companies_by_subsector,
    get_top_growth_companies_by_subsector,
    get_top_revenue_companies_by_subsector,
    get_top_dividend_yield_companies,
    get_top_total_dividend_companies,
    get_top_revenue_companies,
    get_top_earnings_companies,
    get_top_change_companies_by_subsector,
    get_companies_by_subindustries,
    get_companies_by_subindustries2,
    get_companies_by_subindustries3,
    get_companies_by_subindustries4,
    get_companies_by_subsector
  ];

  const llm_with_tools = model.bindTools(tools);

  const messages = [
    new SystemMessage("You're a helpful assistant"),
    new HumanMessage(query),
  ];

  try {
    console.time('Time taken to perform operations')

    const runCollector = new RunCollectorCallbackHandler();
    const ai_msg = await llm_with_tools.invoke(messages, {
      callbacks: [runCollector]
    });

    if (ai_msg.tool_calls) {
      const tool_calls = ai_msg.tool_calls.map(async (tool_call) => {
        const selected_tool = {
          "get_peers": get_peers,
          "get_top_companies_based_on_transaction_volume": get_top_companies_based_on_transaction_volume,
          "get_top_m_cap_companies_by_subsector": get_top_m_cap_companies_by_subsector,
          "get_top_growth_companies_by_subsector": get_top_growth_companies_by_subsector,
          "get_top_revenue_companies_by_subsector": get_top_revenue_companies_by_subsector,
          "get_top_change_companies_by_subsector": get_top_change_companies_by_subsector,
          "get_top_dividend_yield_companies": get_top_dividend_yield_companies,
          "get_top_total_dividend_companies": get_top_total_dividend_companies,
          "get_top_revenue_companies": get_top_revenue_companies,
          "get_top_earnings_companies": get_top_earnings_companies,
          "get_companies_by_subindustries":get_companies_by_subindustries,
          "get_companies_by_subindustries2":get_companies_by_subindustries2,
          "get_companies_by_subindustries3":get_companies_by_subindustries3,
          "get_companies_by_subindustries4":get_companies_by_subindustries4,
          "get_companies_by_subsector" : get_companies_by_subsector
        }[tool_call["name"].toLowerCase()];
    
        if (selected_tool) {
          const tool_output = await selected_tool.invoke(tool_call["args"]);
          return tool_output;
        }
    });
      const getResult = await Promise.all(tool_calls);

      if (getResult[0]) {
        const results = JSON.parse(getResult[0])
        
        if (results.length == 0) {
          const message_error = {
            "error" : "Data not found!"
          }
          
          return JSON.stringify(message_error)
        }

        const runId = runCollector.tracedRuns[0].id;
        return JSON.stringify({
          runId,
          ...results
        });
      } 
    } 
  } catch (error) {

    const message_error = {
    "error" : "Query doesn't match for any tools"
    }

    return JSON.stringify(message_error)

  } finally {
    console.timeEnd("Time taken to perform operations")
  }
}

const result = await generate("top 10 companies in banking sorted by number of employees")
console.log(result)